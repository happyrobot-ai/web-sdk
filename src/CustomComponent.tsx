import { useState } from "react";
import { useWebCall } from "./hooks/use-webcall";

const CustomComponent = () => {
    const { joinCall, isCallOngoing, endCall } = useWebCall();


    const [isLoading, setIsLoading] = useState(false);
    const join = async () => {
        setIsLoading(true);
        // Parse liveKitUrl and token query params
        const searchParams = new URLSearchParams(window.location.search);
        const liveKitUrl = searchParams.get("liveKitUrl");
        const token = searchParams.get("token");
        if (!liveKitUrl || !token) {
            throw new Error("liveKitUrl and token are required");
        }
        // Get from somewhere else
        await joinCall(liveKitUrl, token);
        setIsLoading(false);
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center">
            {isCallOngoing ? (
                <button
                    className="bg-red-500 text-white p-2 rounded-md cursor-pointer hover:bg-red-600"
                    onClick={endCall}
                >
                    End Call
                </button>
            ) : (
                <button
                    className="bg-blue-500 text-white p-2 rounded-md cursor-pointer hover:bg-blue-600 inline-flex"
                    onClick={join}
                >
                    {isLoading ? "Loading..." : "Join"}
                </button>
            )}
        </div>
    );
};

export default CustomComponent;
