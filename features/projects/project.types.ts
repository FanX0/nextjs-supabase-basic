import { Database } from "@/types/database";

export type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  categories?: {
    name: string;
    color: string | null;
  } | null;
};
export type NewProject = Database["public"]["Tables"]["projects"]["Insert"];
