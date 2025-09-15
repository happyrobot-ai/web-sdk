import CustomComponent from "./CustomComponent";
import { useWebCall } from "./hooks/use-webcall";

const ORGANIZATION_ID = "YOUR_ORG_ID";
const USE_CASE_ID = "YOUR_USE_CASE_ID";

function App() {
  const { startCall, endCall, isCallOngoing } = useWebCall();

  // If pathname is /custom, return custom component
  if (window.location.pathname === "/custom") {
    return <CustomComponent />;
  }

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
