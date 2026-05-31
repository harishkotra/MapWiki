import type { Metadata } from "next";
import { DatasetWizard } from "@/features/datasets/dataset-wizard";

export const metadata: Metadata = {
  title: "Create Dataset"
};

export default function NewDatasetPage() {
  return <DatasetWizard />;
}

