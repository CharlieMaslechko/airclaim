import "../global.css";

export const Popup = () => {
  const handleSyncBets = () => {
    console.log("Syncing bets");

    chrome.runtime.sendMessage({ type: "SYNC_ARCHIVES" });
  };

  return (
    <div className="w-80 h-48 bg-[#213743] shadow-2xl text-white font-sans overflow-hidden border border-white/10 backdrop-blur-xl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white/10 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base font-['proxima-nova',sans-serif]">
            {"<"} vector {">"}
          </span>
        </div>
        <div className="flex gap-1">
          <button className="w-6 h-6 bg-white/20 hover:bg-white/30 hover:scale-110 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-200">
            −
          </button>
          <button
            onClick={() => window.close()}
            className="w-6 h-6 bg-white/20 hover:bg-red-400/80 hover:scale-110 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-200"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Bankroll Stat */}
        {/* Sync bets CTA */}
        <div className="p-3 bg-[#0F212E] rounded-lg transition-colors duration-200">
          <button
            onClick={() => handleSyncBets()}
            className="w-full font-semibold font-mono bg-white/10 px-4 py-3 rounded text-sm hover:bg-white/20 transition-all duration-200"
          >
            Sync bets
          </button>
        </div>

        {/* Additional Controls/Info */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-xs text-white/70 text-center">
            Vector Chrome Extension
          </div>
        </div>
      </div>
    </div>
  );
};
