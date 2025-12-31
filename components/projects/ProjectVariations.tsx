"use client";

import {
  Variation,
  getVariations,
  createVariation,
  deleteVariation,
} from "@/features/projects/variation.actions";
import { useEffect, useState, useTransition } from "react";

export function ProjectVariations({ projectId }: { projectId: string }) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    loadVariations();
  }, [projectId]);

  async function loadVariations() {
    setLoading(true);
    try {
      const data = await getVariations(projectId);
      setVariations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = () => {
    if (!newName) return;
    startTransition(async () => {
      try {
        await createVariation({
          project_id: projectId,
          name: newName,
          description: newDesc,
          price: newPrice ? parseFloat(newPrice) : undefined,
        });
        setNewName("");
        setNewDesc("");
        setNewPrice("");
        await loadVariations(); // Reload list
      } catch (err) {
        console.error(err);
        alert("Failed to add variation");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this variation?")) return;
    startTransition(async () => {
      try {
        await deleteVariation(id, projectId);
        setVariations((prev) => prev.filter((v) => v.id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete variation");
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700 mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Variations
      </h2>

      {/* List */}
      <div className="space-y-4 mb-8">
        {loading ? (
          <p className="text-sm text-gray-500">Loading variations...</p>
        ) : variations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No variations added.</p>
        ) : (
          variations.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {v.name}
                </h3>
                {v.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {v.description}
                  </p>
                )}
                {v.price !== undefined && v.price !== null && (
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                    ${v.price.toFixed(2)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(v.id)}
                disabled={isPending}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Form */}
      <div className="border-t dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Add New Variation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name (e.g. Red, XL, Basic)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-transparent dark:text-white border"
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-transparent dark:text-white border"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price (Optional)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-transparent dark:text-white border"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={isPending || !newName}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50 text-sm"
        >
          {isPending ? "Adding..." : "Add Variation"}
        </button>
      </div>
    </div>
  );
}
