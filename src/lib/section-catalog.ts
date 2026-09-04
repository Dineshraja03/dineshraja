export type SectionKey =
  | "photography"
  | "before-after"
  | "videography"
  | "branding"
  | "testimonials"
  | "contact"
  | "cards"
  | "stack"
  | "project"
  | "experiments";

export type SectionField = "subtitle" | "body" | "primaryMedia" | "secondaryMedia" | "link" | "altText" | "tags" | "cardImages";

export type SectionDefinition = {
  key: SectionKey;
  label: string;
  description: string;
  fields: SectionField[];
};

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { key: "photography", label: "Photography", description: "Gallery section to display photos.", fields: ["subtitle", "primaryMedia", "altText", "tags"] },
  { key: "before-after", label: "Before / after", description: "Photo comparison section with before and after images.", fields: ["subtitle", "primaryMedia", "secondaryMedia", "altText"] },
  { key: "videography", label: "Videography", description: "Video section powered by YouTube links.", fields: ["subtitle", "primaryMedia", "altText", "link"] },
  { key: "branding", label: "Branding", description: "Brand work, identity systems, and visual design projects.", fields: ["subtitle", "body", "primaryMedia", "altText", "link"] },
  { key: "testimonials", label: "Testimonials", description: "Testimonials from clients and collaborators.", fields: [] },
  { key: "contact", label: "Contact", description: "A contact form for visitors to get in touch.", fields: [] },
  { key: "cards", label: "Cards", description: "Action cards with square images, main text, and supporting text.", fields: ["subtitle", "body", "cardImages", "altText", "link"] },
  { key: "stack", label: "Stack", description: "Technology and tools used across the work.", fields: ["tags"] },
  { key: "project", label: "Projects", description: "Projects to showcase with an optional image.", fields: ["subtitle", "body", "primaryMedia", "altText", "tags", "link"] },
  { key: "experiments", label: "Experiments", description: "DIY, experimental, and playful items with an optional image.", fields: ["subtitle", "body", "primaryMedia", "altText", "tags", "link"] },
];

export function sectionDefinition(key: string | null | undefined) {
  return SECTION_DEFINITIONS.find((definition) => definition.key === key) ?? null;
}

export function normalizedSectionKey(key: string) {
  if (key === "editing") return "before-after";
  if (key === "design") return "branding";
  if (key === "projects") return "project";
  return key;
}

export function hasSectionField(key: string, field: SectionField) {
  return sectionDefinition(normalizedSectionKey(key))?.fields.includes(field) ?? false;
}
