import { assemblePlan } from "./plan-assembly";
import {
  ProfileSchema,
  LocationSchema,
  AirSchema,
  type Profile,
  type Location,
  type Air,
  type Plan,
} from "@/domain/types";
/** Pure local fallback; does not invent live air or contact a model/provider. */
export function localPlan(
  profile: Profile,
  location: Location,
  air: Air,
): Plan {
  ProfileSchema.parse(profile);
  LocationSchema.parse(location);
  AirSchema.parse(air);
  return assemblePlan(profile, location, air);
}
