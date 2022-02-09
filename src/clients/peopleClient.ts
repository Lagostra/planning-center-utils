import { IPerson } from "../types/contractTypes";
import { get } from "../utils/crud";

const BASE_URL = "https://api.planningcenteronline.com/people/v2";

export const getPeople = async (): Promise<IPerson[]> => {
  const result = await get(`${BASE_URL}/people?per_page=500`);
  return result;
};