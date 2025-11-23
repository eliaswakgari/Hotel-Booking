export const calculatePrice = (basePrice, date, occupancy, maxOccupancy) => {
  let price = basePrice;

  // Seasonal pricing (weekends + holidays)
  const day = new Date(date).getDay();
  if (day === 5 || day === 6) price *= 1.2; // 20% increase on weekends

  // Demand-based pricing
  const occupancyRate = occupancy / maxOccupancy;
  if (occupancyRate > 0.8) price *= 1.5; // 50% increase if almost full

  return price.toFixed(2);
};
