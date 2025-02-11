import { useWebCall } from "./hooks/use-webcall";

const ORGANIZATION_ID = "your_org_id";
const USE_CASE_ID = "your_use_case_id";

function App() {
  const { startCall, endCall, isCallOngoing } = useWebCall();

  const start = () => {
    // Get from somewhere else
    startCall(ORGANIZATION_ID, USE_CASE_ID);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      {isCallOngoing ? (
        <button
          className="bg-red-500 text-white p-2 rounded-md"
          onClick={endCall}
        >
          End Call
        </button>
      ) : (
        <button
          className="bg-blue-500 text-white p-2 rounded-md"
          onClick={start}
        >
          Start Call
        </button>
      )}
    </div>
  );
}

export default App;
