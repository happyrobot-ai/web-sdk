"use client";

import {
  LocalTrackPublication,
  RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from "@happyrobotai/web-client";
import { createContext, useContext, useState } from "react";

export interface ConnectOptions {
  url: string;
  token: string;
}

interface UseWebCallContextSchema {
  isCallOngoing: boolean;
  startCall?: (organizationId: string, useCaseId: string) => Promise<void>;
  joinCall?: (roomUrl: string, token: string) => Promise<void>;
  endCall?: () => Promise<void>;
}

export const WebCallContext = createContext<UseWebCallContextSchema>({
  isCallOngoing: false,
  startCall: undefined,
  endCall: undefined,
});

export const useWebCall = () => {
  const { isCallOngoing, startCall, joinCall, endCall } =
    useContext(WebCallContext);
  if (
    startCall === undefined ||
    endCall === undefined ||
    joinCall === undefined
  ) {
    throw new Error("useWebCall must be used within a ProvideWebCall");
  }
  return { isCallOngoing, startCall, joinCall, endCall };
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

  const connect = async (options: ConnectOptions) => {
    // creates a new room with options
    const room = new Room({
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: false,
      },
      publishDefaults: {
        dtx: false,
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
    const host =
      import.meta.env.VITE_HAPPYROBOT_URL ||
      "https://v2.platform.happyrobot.ai";

    // Get access token from happyrobot backend
    const response = await fetch(`${host}/api/webcall-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": organizationId,
        Authorization: `Bearer ${api_key}`,
      },
      body: JSON.stringify({
        use_case_id: useCaseId,
        // Your params defined in the workflow's webcall node here
        data: {
          name: "John Doe",
          // "email": "john.doe@example.com",
        },
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to get access token");
    }
    const options = await response.json();

    // Connect to room
    await connect(options);
  };

  const joinCall = async (roomUrl: string, token: string) => {
    // Connect to room
    await connect({ url: roomUrl, token });
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
        joinCall,
        endCall,
      }}
    >
      {children}
    </WebCallContext.Provider>
  );
};
