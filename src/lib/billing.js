// Pricing tiers (ex VAT, per seat per month) — from the published pricing page.
export const PRICING_TIERS = [
  { maxSeats: 50, pricePerSeat: 110 },
  { maxSeats: 100, pricePerSeat: 95 },
  { maxSeats: 250, pricePerSeat: 85 },
  { maxSeats: Infinity, pricePerSeat: 75 },
];

export const getPricePerSeat = (seatCount) => {
  for (const tier of PRICING_TIERS) {
    if (seatCount <= tier.maxSeats) return tier.pricePerSeat;
  }
  return 75;
};

export const formatZAR = (amount) =>
  'R' + Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBillingPeriod = (date = new Date()) =>
  date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

/**
 * Calculate monthly billing for a tenant, including prorata for agents
 * added mid-billing-cycle (calendar month).
 *
 * @param {Array} agents   — Agent records belonging to this tenant
 * @param {Object} company — Company record (may be null for unassigned tenants)
 * @param {Date}   refDate — reference date for the billing period
 */
export const calculateTenantBilling = (agents, company, refDate = new Date()) => {
  const activeAgents = agents.filter((a) => a.status !== 'Suspended');
  const seatCount = activeAgents.length;
  const pricePerSeat = getPricePerSeat(seatCount);

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let fullMonthSeats = 0;
  const prorataSeats = [];
  let prorataCharge = 0;

  activeAgents.forEach((agent) => {
    const created = new Date(agent.created_date);
    if (created.getFullYear() === year && created.getMonth() === month) {
      const dayCreated = created.getDate();
      const refDay = refDate.getDate();
      const daysActive = Math.max(1, refDay - dayCreated + 1);
      const prorataFraction = daysActive / daysInMonth;
      const charge = pricePerSeat * prorataFraction;
      prorataSeats.push({ ...agent, daysActive, prorataFraction, prorataCharge: charge });
      prorataCharge += charge;
    } else {
      fullMonthSeats++;
    }
  });

  const fullMonthCharge = fullMonthSeats * pricePerSeat;
  const totalCharge = fullMonthCharge + prorataCharge;

  return {
    seatCount,
    pricePerSeat,
    fullMonthSeats,
    prorataSeats,
    fullMonthCharge,
    prorataCharge,
    totalCharge,
    plan: company?.plan || 'trial',
    seatLimit: company?.seat_limit ?? null,
    trialEndDate: company?.trial_end_date || null,
    billingContact: company?.billing_contact_email || null,
  };
};