import { Paths, File, Directory } from "expo-file-system";
import type { StateStorage } from "zustand/middleware";

const storeDir = new Directory(Paths.document, "store");

function storeFile(name: string) {
  return new File(storeDir, name + ".json");
}

export const fileStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const file = storeFile(name);
      if (!file.exists) return null;
      return file.text();
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      if (!storeDir.exists) {
        storeDir.create();
      }
      const file = storeFile(name);
      file.write(value);
    } catch {}
  },
  removeItem: async (name) => {
    try {
      const file = storeFile(name);
      if (file.exists) {
        file.delete();
      }
    } catch {}
  },
};
