import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { readCloudData } from "../lib/cloud-storage";
import { supabase } from "../lib/supabase";

/** Mirrors the existing localStorage-based sections without changing their UI. */
export default function CloudSync({ user }: { user: User }) {
  const previous = useRef("");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let saving = false;
    const save = async () => {
      const data = readCloudData();
      const serialized = JSON.stringify(data);
      if (serialized === previous.current || saving) return;
      saving = true;
      const { error } = await client.from("user_data").upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
      if (!error) previous.current = serialized;
      else console.error("Supabase sync failed", error);
      saving = false;
    };
    previous.current = JSON.stringify(readCloudData());
    const interval = window.setInterval(save, 1500);
    const onHidden = () => { if (document.visibilityState === "hidden") void save(); };
    document.addEventListener("visibilitychange", onHidden);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onHidden); void save(); };
  }, [user.id]);

  return null;
}
