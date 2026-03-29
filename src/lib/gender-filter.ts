export type GenderFilter = "Male" | "Female" | "";

export function getOppositeGenderFilter(value: string | null | undefined): GenderFilter {
  const normalized = value?.trim().toLowerCase() ?? "";

  const isFemale = /(^|\W)(female|woman|f)(\W|$)/.test(normalized);
  const isMale = /(^|\W)(male|man|m)(\W|$)/.test(normalized);

  if (isFemale) {
    return "Male";
  }

  if (isMale) {
    return "Female";
  }

  return "";
}

export function matchesGenderFilter(candidateGender: string | null | undefined, filterGender: GenderFilter) {
  if (!filterGender) {
    return true;
  }

  const normalizedCandidate = candidateGender?.trim().toLowerCase() ?? "";
  return normalizedCandidate === filterGender.toLowerCase();
}
