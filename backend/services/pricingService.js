exports.calculateDynamicPrice = (hotel, checkInDate, checkOutDate) => {
  const basePrice = hotel?.basePrice || 0;
  let seasonalAdjustment = 0;
  const today = new Date();

  // ✅ Only loop if seasonalPricing exists and is an array
  if (Array.isArray(hotel?.seasonalPricing)) {
    hotel.seasonalPricing.forEach((rule) => {
      const start = new Date(rule.startDate);
      const end = new Date(rule.endDate);
      if (today >= start && today <= end) {
        seasonalAdjustment = rule.price || 0;
      }
    });
  }

  const demandFactor = Math.random() * 0.3; // simulate 0–30% increase
  const dynamicPrice = basePrice + seasonalAdjustment + basePrice * demandFactor;

  return Math.round(dynamicPrice);
};
