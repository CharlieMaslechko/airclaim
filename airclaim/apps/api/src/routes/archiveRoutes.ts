import { Router, Request, Response } from "express";
import { Storage } from "@google-cloud/storage";

const router = Router();

/**
 * Google Cloud Storage configuration
 */
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || "vector_archives";
const bucket = storage.bucket(bucketName);

/**
 * Archive state interface
 * @remarks In-memory storage - TODO: migrate to Firestore/Postgres for production
 */
interface ArchiveState {
  userId: string;
  totalChunks: number;
  receivedChunks: number;
  filePath: string;
  status: "pending" | "uploading" | "complete" | "failed";
}

/**
 * In-memory archive state store
 * @remarks This should be replaced with a persistent database in production
 */
const archiveState: Record<string, ArchiveState> = {};

// ============================================================================
// COLLECTION ROUTES (must come before parameterized routes)
// ============================================================================

/**
 * List all archives for the authenticated user
 * @route GET /api/archives
 * @returns {Object} 200 - List of archives with count
 * @returns {Object} 500 - Internal server error
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    /** @todo Get userId from auth middleware */
    const userId = (req as any).user?.id || "default-user";

    // Get user's archives from state
    const archives = Object.entries(archiveState)
      .filter(([_, state]) => state.userId === userId)
      .map(([archiveId, state]) => ({
        archiveId,
        status: state.status,
        progress:
          ((state.receivedChunks / state.totalChunks) * 100).toFixed(2) + "%",
        filePath: state.filePath,
        receivedChunks: state.receivedChunks,
        totalChunks: state.totalChunks,
        lastUpdated: new Date().toISOString(), // TODO: Track actual update time
      }));

    res.json({
      archives,
      count: archives.length,
    });
  } catch (error) {
    console.error("Error listing archives:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list archives",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Create a new archive
 * @route POST /api/archives
 * @param {string} req.body.archiveId - Unique identifier for the archive
 * @param {number} req.body.totalChunks - Total number of chunks to be uploaded
 * @param {number} [req.body.totalBets] - Optional total number of bets
 * @returns {Object} 201 - Archive created successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 409 - Archive already exists
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body:
 * {
 *   "archiveId": "user123-20251002",
 *   "totalChunks": 10,
 *   "totalBets": 43000
 * }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { archiveId, totalChunks, totalBets } = req.body;

    if (!archiveId || !totalChunks) {
      res.status(400).json({
        success: false,
        error: "archiveId and totalChunks are required",
      });
      return;
    }

    /** @todo Get userId from auth middleware */
    const userId = (req as any).user?.id || "default-user";

    const filePath = `${userId}/${archiveId}.jsonl`;
    if (archiveState[archiveId]) {
      res.status(409).json({
        success: false,
        error: "Archive already exists",
      });
      return;
    }

    archiveState[archiveId] = {
      userId,
      totalChunks,
      receivedChunks: 0,
      filePath,
      status: "pending",
    };
    const file = bucket.file(filePath);
    await file.save("", { resumable: false });

    res.status(201).json({
      archiveId,
      status: "pending",
      filePath,
      totalChunks,
      totalBets: totalBets || null,
      receivedChunks: 0,
    });
  } catch (error) {
    console.error("Error creating archive:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create archive",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============================================================================
// INDIVIDUAL RESOURCE ROUTES
// ============================================================================

/**
 * Get a single archive by ID
 * @route GET /api/archives/:archiveId
 * @param {string} req.params.archiveId - Archive identifier
 * @returns {Object} 200 - Archive details
 * @returns {Object} 404 - Archive not found
 * @returns {Object} 500 - Internal server error
 */
router.get("/:archiveId", (req: Request, res: Response) => {
  try {
    const { archiveId } = req.params;

    if (!archiveId) {
      res.status(400).json({
        success: false,
        error: "archiveId is required",
      });
      return;
    }

    const state = archiveState[archiveId];
    if (!state) {
      res.status(404).json({
        success: false,
        error: "Archive not found",
      });
      return;
    }

    res.json({
      archiveId,
      userId: state.userId,
      status: state.status,
      receivedChunks: state.receivedChunks,
      totalChunks: state.totalChunks,
      progress:
        ((state.receivedChunks / state.totalChunks) * 100).toFixed(2) + "%",
      filePath: state.filePath,
      lastUpdated: new Date().toISOString(), // TODO: Track actual update time
    });
  } catch (error) {
    console.error("Error getting archive:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get archive",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Update an archive status (finalize or cancel)
 * @route PATCH /api/archives/:archiveId
 * @param {string} req.params.archiveId - Archive identifier
 * @param {string} req.body.status - Status action: "finalize" or "cancel"
 * @returns {Object} 200 - Archive updated successfully
 * @returns {Object} 400 - Invalid status or incomplete upload
 * @returns {Object} 404 - Archive not found
 * @returns {Object} 500 - Internal server error
 */
router.patch("/:archiveId", async (req: Request, res: Response) => {
  try {
    const { archiveId } = req.params;
    const { status } = req.body;

    if (!archiveId) {
      res.status(400).json({
        success: false,
        error: "archiveId is required",
      });
      return;
    }

    const state = archiveState[archiveId];
    if (!state) {
      res.status(404).json({
        success: false,
        error: "Archive not found",
      });
      return;
    }

    if (status === "finalize") {
      if (state.receivedChunks !== state.totalChunks) {
        res.status(400).json({
          success: false,
          error: `Incomplete upload: received ${state.receivedChunks}/${state.totalChunks} chunks`,
        });
        return;
      }

      state.status = "complete";

      /** @todo Trigger post-processing (BigQuery import, indexing, etc.) */
      const jobId = `bigquery-job-${Date.now()}`;

      res.json({
        archiveId,
        status: "completed",
        filePath: state.filePath,
        jobId,
        message: "Archive finalized successfully",
      });
      return;
    }

    if (status === "cancel") {
      state.status = "failed";
      res.json({
        archiveId,
        status: "cancelled",
        message: "Archive cancelled",
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: "Invalid status. Use 'finalize' or 'cancel'",
    });
  } catch (error) {
    console.error("Error updating archive:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update archive",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Delete an archive and its associated file
 * @route DELETE /api/archives/:archiveId
 * @param {string} req.params.archiveId - Archive identifier
 * @returns {void} 204 - Archive deleted successfully (no content)
 * @returns {Object} 403 - Forbidden (user doesn't own archive)
 * @returns {Object} 404 - Archive not found
 * @returns {Object} 500 - Internal server error
 */
router.delete("/:archiveId", async (req: Request, res: Response) => {
  try {
    const { archiveId } = req.params;

    if (!archiveId) {
      res.status(400).json({
        success: false,
        error: "archiveId is required",
      });
      return;
    }

    const state = archiveState[archiveId];
    if (!state) {
      res.status(404).json({
        success: false,
        error: "Archive not found",
      });
      return;
    }

    /** @todo Add auth middleware to ensure user owns this archive */
    const userId = (req as any).user?.id || "default-user";
    if (state.userId !== userId) {
      res.status(403).json({
        success: false,
        error: "Forbidden: You don't own this archive",
      });
      return;
    }

    try {
      const file = bucket.file(state.filePath);
      await file.delete();
    } catch (gcsError) {
      console.warn("Failed to delete from GCS:", gcsError);
    }
    delete archiveState[archiveId];

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting archive:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete archive",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============================================================================
// SUB-RESOURCE ROUTES
// ============================================================================

/**
 * Upload a chunk of data to an archive
 * @route POST /api/archives/:archive_id/chunks
 * @param {string} req.params.archive_id - Archive identifier
 * @param {number} req.body.chunkIndex - Index of the chunk being uploaded
 * @param {Array} req.body.bets - Array of bet objects to upload
 * @returns {Object} 200 - Chunk uploaded successfully with progress
 * @returns {Object} 400 - Validation error
 * @returns {Object} 404 - Archive not found
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body:
 * {
 *   "chunkIndex": 0,
 *   "bets": [
 *     { "betId": "123", "amount": 100, "game": "limbo" }
 *   ]
 * }
 */
router.post("/:archive_id/chunks", async (req: Request, res: Response) => {
  try {
    const { archive_id } = req.params;
    const { chunkIndex, bets } = req.body;

    if (!archive_id) {
      res.status(400).json({
        success: false,
        error: "archive_id is required",
      });
      return;
    }

    if (chunkIndex === undefined || !bets) {
      res.status(400).json({
        success: false,
        error: "chunkIndex and bets are required",
      });
      return;
    }

    const state = archiveState[archive_id];
    if (!state) {
      res.status(404).json({
        success: false,
        error: "Archive not found",
      });
      return;
    }

    if (state.status === "pending") {
      state.status = "uploading";
    }

    const file = bucket.file(state.filePath);
    const chunkData = Array.isArray(bets)
      ? bets.map((item) => JSON.stringify(item)).join("\n") + "\n"
      : bets;

    /** @todo Implement proper file appending with offset tracking */
    await file.save(chunkData, {
      resumable: false,
      offset: 0,
    });

    state.receivedChunks++;

    res.json({
      archive_id,
      chunkIndex,
      status: state.status,
      receivedChunks: state.receivedChunks,
      totalChunks: state.totalChunks,
      progress:
        ((state.receivedChunks / state.totalChunks) * 100).toFixed(2) + "%",
    });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload chunk",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
