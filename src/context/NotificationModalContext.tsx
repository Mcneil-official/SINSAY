import React, { createContext, useContext, useState, useCallback } from "react";
import { AnnouncementRow } from "../types/supabase";

export interface NotificationModalContextType {
  isNotifModalOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  selectedAnnouncement: AnnouncementRow | null;
  openAnnouncementModal: (announcement: AnnouncementRow) => void;
  closeAnnouncementModal: () => void;
}

const NotificationModalContext = createContext<NotificationModalContextType | undefined>(undefined);

export function NotificationModalProvider({ children }: { children: React.ReactNode }) {
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRow | null>(null);

  const openNotifications = useCallback(() => {
    setIsNotifModalOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setIsNotifModalOpen(false);
  }, []);

  const openAnnouncementModal = useCallback((announcement: AnnouncementRow) => {
    setSelectedAnnouncement(announcement);
  }, []);

  const closeAnnouncementModal = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  return (
    <NotificationModalContext.Provider
      value={{
        isNotifModalOpen,
        openNotifications,
        closeNotifications,
        selectedAnnouncement,
        openAnnouncementModal,
        closeAnnouncementModal,
      }}
    >
      {children}
    </NotificationModalContext.Provider>
  );
}

export function useNotificationModal(): NotificationModalContextType {
  const context = useContext(NotificationModalContext);
  if (!context) {
    throw new Error("useNotificationModal must be used within a NotificationModalProvider");
  }
  return context;
}
