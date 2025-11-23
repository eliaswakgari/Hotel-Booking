import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Swal from "sweetalert2";

// Mock API for demonstration
const fetchPricingRules = async () => {
  return [
    { id: 1, type: "seasonal", name: "Weekend Rate", multiplier: 1.2 },
    { id: 2, type: "seasonal", name: "Holiday Rate", multiplier: 1.5 },
    { id: 3, type: "demand", name: "Low Availability (<20%)", multiplier: 1.3 },
  ];
};

const updatePricingRule = async (ruleId, multiplier) => {
  // Replace with actual API call
  console.log("Updating rule", ruleId, "to", multiplier);
  return { success: true };
};

const PricingRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [newMultiplier, setNewMultiplier] = useState("");

  useEffect(() => {
    const getRules = async () => {
      setLoading(true);
      const data = await fetchPricingRules();
      setRules(data);
      setLoading(false);
    };
    getRules();
  }, []);

  const handleEdit = (rule) => {
    setEditingRuleId(rule.id);
    setNewMultiplier(rule.multiplier);
  };

  const handleSave = async (ruleId) => {
    if (newMultiplier <= 0) {
      Swal.fire("Error", "Multiplier must be greater than 0", "error");
      return;
    }
    const res = await updatePricingRule(ruleId, newMultiplier);
    if (res.success) {
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === ruleId ? { ...rule, multiplier: newMultiplier } : rule
        )
      );
      Swal.fire("Success", "Pricing rule updated!", "success");
      setEditingRuleId(null);
    }
  };

  const handleCancel = () => {
    setEditingRuleId(null);
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Dynamic Pricing Rules</h2>

      {loading ? (
        <p className="text-gray-700 dark:text-gray-200">Loading rules...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 hover:shadow-lg transition"
            >
              <p className="text-gray-500 dark:text-gray-300 mb-2">
                {rule.type.toUpperCase()} RULE
              </p>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                {rule.name}
              </h3>

              {editingRuleId === rule.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newMultiplier}
                    onChange={(e) => setNewMultiplier(parseFloat(e.target.value))}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(rule.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-blue-600">
                    x{rule.multiplier}
                  </p>
                  <button
                    onClick={() => handleEdit(rule)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default PricingRules;
