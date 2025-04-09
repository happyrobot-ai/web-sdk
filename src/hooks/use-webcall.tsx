"use client";

import {
  LocalTrackPublication,
  RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import { createContext, useContext, useState } from "react";

export interface LivekitOptions {
  url: string;
  token: string;
}

interface UseWebCallContextSchema {
  isCallOngoing: boolean;
  startCall?: (organizationId: string, useCaseId: string) => Promise<void>;
  endCall?: () => Promise<void>;
}

export const WebCallContext = createContext<UseWebCallContextSchema>({
  isCallOngoing: false,
  startCall: undefined,
  endCall: undefined,
});

export const useWebCall = () => {
  const { isCallOngoing, startCall, endCall } = useContext(WebCallContext);
  if (startCall === undefined || endCall === undefined) {
    throw new Error("useWebCall must be used within a ProvideWebCall");
  }
  return { isCallOngoing, startCall, endCall };
};

interface Props {
  children: React.ReactNode;
}
export const ProvideWebCall = ({ children }: Props) => {
  const [isCallOngoing, setIsCallOngoing] = useState<boolean>(false);
  const [room, setRoom] = useState<Room | null>(null);

  const handleTrackSubscribed = (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      track.attach();
    }
  };

  const handleTrackUnsubscribed = (track: RemoteTrack) => {
    // remove tracks from all attached elements
    track.detach();
  };

  const handleLocalTrackUnpublished = (publication: LocalTrackPublication) => {
    // when local tracks are ended, update UI to remove them from rendering
    publication.track?.detach();
  };

  const handleDisconnect = () => {
    setIsCallOngoing(false);
  };

  const handleParticipantDisconnected = () => {
    // End the call
    endCall().catch(console.error);
  };

  const connect = async (options: LivekitOptions) => {
    // creates a new room with options
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: false,
      },
    });

    // Enable mic
    await room.prepareConnection(options.url, options.token);

    // set up event listeners
    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.Disconnected, handleDisconnect)
      .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    // connect to room
    await room.connect(options.url, options.token);
    await room.localParticipant.setMicrophoneEnabled(true);

    // Set states
    setRoom(room);
    setIsCallOngoing(true);
  };

  const startCall = async (organizationId: string, useCaseId: string) => {
    setIsCallOngoing(true);

    // Api key and host from env
    const api_key = import.meta.env.VITE_HAPPYROBOT_API_KEY;
    const host = import.meta.env.VITE_HAPPYROBOT_URL || "https://platform.happyrobot.ai";

    // Get access token from happyrobot backend
    const response = await fetch(`${host}/api/token/${useCaseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": organizationId,
        Authorization: `Bearer ${api_key}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to get access token");
    }
    const options = await response.json();

    // Connect to room
    await connect(options);
  };

  const endCall = async () => {
    if (room) {
      await room.disconnect();
    }
  };

  return (
    <WebCallContext.Provider
      value={{
        isCallOngoing,
        startCall,
        endCall,
      }}
    >
      {children}
    </WebCallContext.Provider>
  );
};
