import { z } from "zod";
export const ProfileSchema = z
  .object({
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(15),
    childAges: z.array(z.number().int().min(0).max(17)).max(15).default([]),
    elders: z.number().int().min(0).max(10),
    higherRisk: z.boolean(),
    pregnant: z.boolean(),
    pets: z.boolean(),
    sealing: z.enum(["sealed", "typical", "leaky"]),
    dwelling: z.enum(["apartment", "house", "hostel"]).default("apartment"),
    floor: z.number().int().min(0).max(100).default(1),
    ceiling: z.number().min(2).max(6).default(2.7),
    ventilation: z.enum(["limited", "windows", "filtered"]).default("windows"),
    roomArea: z.number().min(5).max(150),
    purifier: z.boolean(),
    cadr: z.number().min(0).max(2000),
    exhaust: z.boolean(),
    cooking: z.enum([
      "lpg",
      "png",
      "induction",
      "biomass",
      "mixed",
      "kerosene",
    ]),
    heating: z.enum([
      "none",
      "electric",
      "gas",
      "coal_wood",
      "ac_heat",
      "kerosene",
    ]),
    cookingHours: z.number().min(0).max(12).default(1),
    heatingHours: z.number().min(0).max(24).default(0),
    mode: z.enum([
      "car",
      "bus",
      "metro",
      "cycle",
      "walk",
      "ev",
      "motorcycle",
      "auto",
      "erickshaw",
    ]),
    vehicleFuel: z
      .enum(["petrol", "diesel", "cng", "electric"])
      .default("petrol"),
    km: z.number().min(0).max(300),
    occupancy: z.number().int().min(1).max(8),
    transit: z.boolean(),
    schoolRun: z.boolean(),
    outdoorHours: z.number().min(0).max(24),
    exercise: z.boolean(),
    activity: z.enum(["rest", "walking", "running"]).default("rest"),
    mask: z.enum(["none", "cloth", "surgical", "n95"]).default("none"),
    timeMinutes: z.number().int().min(5).max(180).default(30),
    wfhDays: z.number().int().min(0).max(7),
    budget: z.enum(["free", "low", "medium"]),
    lang: z.enum(["en", "hi"]),
    simple: z.boolean(),
  })
  .strict()
  .refine((profile) => profile.childAges.length <= profile.children, {
    path: ["childAges"],
    message: "More ages than children were entered.",
  });
export type Profile = z.infer<typeof ProfileSchema>;
export const LocationSchema = z
  .object({
    name: z.string().min(1).max(100),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  })
  .strict();
export type Location = z.infer<typeof LocationSchema>;
export const AirSchema = z.object({
  pm25: z.number().min(0).max(10000),
  hourly: z.array(z.object({ time: z.string(), pm25: z.number().min(0) })),
  fetchedAt: z.string(),
  observedAt: z.string(),
  source: z.enum(["open-meteo", "open-meteo-browser", "manual", "demo"]),
  stale: z.boolean(),
  timezone: z.string(),
});
export type Air = z.infer<typeof AirSchema>;
export const RequestSchema = z
  .object({
    profile: ProfileSchema,
    location: LocationSchema,
    manualPm: z.number().min(0).max(1000).optional(),
    offline: z.boolean().optional(),
    browserAir: z
      .object({
        location: LocationSchema,
        air: AirSchema.extend({
          source: z.literal("open-meteo-browser"),
          fetchedAt: z.string().datetime(),
          observedAt: z.string().min(1).max(40),
          timezone: z.string().min(1).max(80),
          hourly: z
            .array(
              z
                .object({
                  time: z.string().max(40),
                  pm25: z.number().min(0).max(10000),
                })
                .strict(),
            )
            .max(48),
        }).strict(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const ActionSchema = z.object({
  id: z.string(),
  category: z.enum([
    "Routine",
    "Indoor air",
    "Transport",
    "Cooking & heating",
    "Community",
    "Health",
  ]),
  title: z.string(),
  summary: z.string(),
  steps: z.array(z.string()).min(1),
  caveats: z.array(z.string()).min(1),
  tags: z.array(z.string()).min(1),
  whoFor: z.array(z.string()).min(1),
  minutes: z.number().int().min(1).max(60),
  hi: z.object({
    title: z.string(),
    summary: z.string(),
    steps: z.array(z.string()).min(1),
    caveats: z.array(z.string()).min(1),
  }),
  cost: z.enum(["free", "low", "medium"]),
  effort: z.number().min(1).max(3),
  group: z.string(),
  effect: z.enum([
    "none",
    "indoor",
    "filter",
    "mask",
    "transit",
    "carpool",
    "remote",
  ]),
  condition: z.enum([
    "always",
    "smog",
    "coal",
    "biomass",
    "car",
    "filter",
    "exercise",
    "risk",
  ]),
  sources: z.array(z.string()).min(1),
});
export type Action = z.infer<typeof ActionSchema>;
export type Impact = {
  baseline: number;
  after: number;
  percent: number;
  co2KgDay: number;
  cigaretteEq: number;
  selected: string[];
};
/** Validate an untrusted HTTP plan before it can enter the rendered workspace. */
export const PlanSchema = z.object({
  headline: z.string().min(1).max(500),
  summary: z.string().min(1).max(2000),
  actions: z
    .array(ActionSchema.extend({ why: z.string().max(2000) }))
    .min(1)
    .max(10),
  generatedBy: z.enum(["llm", "rules"]),
  air: AirSchema,
  profile: ProfileSchema,
  location: LocationSchema,
  impact: z.object({
    baseline: z.number().nonnegative(),
    after: z.number().nonnegative(),
    percent: z.number().min(0).max(100),
    co2KgDay: z.number().nonnegative(),
    cigaretteEq: z.number().nonnegative(),
    selected: z.array(z.string()).max(10),
  }),
  createdAt: z.string().datetime(),
});

export type Plan = z.infer<typeof PlanSchema>;
