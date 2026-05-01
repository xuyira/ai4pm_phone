"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { PrototypeStoreToastProvider } from "@/components/toast";
import { records, type FeatureType, type RecordItem } from "@/lib/prototype-data";

type PrototypeStoreValue = {
  records: RecordItem[];
  deleteRecord: (id: string) => void;
  getRecord: (id: string) => RecordItem | undefined;
  getRecordsByType: (type: FeatureType) => RecordItem[];
};

const HIDDEN_KEY = "ai4pm-hidden-records";
const PrototypeStore = createContext<PrototypeStoreValue | null>(null);

export function PrototypeStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(HIDDEN_KEY);
    if (saved) {
      setHiddenIds(JSON.parse(saved) as string[]);
    }
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setHiddenIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const visibleRecords = useMemo(
    () => records.filter((item) => !hiddenIds.includes(item.id)),
    [hiddenIds]
  );

  const value = useMemo<PrototypeStoreValue>(
    () => ({
      records: visibleRecords,
      deleteRecord,
      getRecord: (id) => visibleRecords.find((item) => item.id === id),
      getRecordsByType: (type) => visibleRecords.filter((item) => item.type === type)
    }),
    [deleteRecord, visibleRecords]
  );

  return (
    <PrototypeStoreToastProvider>
      <PrototypeStore.Provider value={value}>{children}</PrototypeStore.Provider>
    </PrototypeStoreToastProvider>
  );
}

export function usePrototypeStore() {
  const value = useContext(PrototypeStore);

  if (!value) {
    throw new Error("usePrototypeStore must be used inside PrototypeStoreProvider");
  }

  return value;
}
