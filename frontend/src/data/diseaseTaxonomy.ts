/**
 * Clinical Condition Educational Dossier
 * 
 * Medical Reference Sources:
 * 1. Fitzpatrick's Dermatology in General Medicine (9th Edition, McGraw-Hill)
 * 2. Rook's Textbook of Dermatology (9th Edition, Wiley-Blackwell)
 * 3. WHO International Classification of Diseases, 11th Revision (ICD-11), Chapter 14: Diseases of the skin
 * 4. DermaCon-IN Dataset Documentation & Metadata, Harvard Dataverse (DOI: 10.7910/DVN/W7OUZM)
 * 
 * SCIENTIFIC GOVERNANCE NOTE:
 * These descriptions provide general educational context regarding dermatological disease
 * categories as recognized in standard medical literature. The Swin-B model in SamaDerma
 * was trained exclusively on broad, image-level category labels from the DermaCon-IN collection.
 * The model DOES NOT predict or differentiate individual diseases within these categories,
 * and inclusion of a disease in this educational reference does NOT imply the model can diagnose it.
 */

export interface DiseaseCategoryTaxonomy {
  category: string;
  classIndex: number;
  icd11ChapterReference: string;
  generalDescription: string;
  clinicalMorphology: string[];
  representativeConditions: string[];
  educationalNotes: string;
  literatureSources: string[];
}

export const DISEASE_TAXONOMY: Record<string, DiseaseCategoryTaxonomy> = {
  'Infectious Disorders': {
    category: 'Infectious Disorders',
    classIndex: 0,
    icd11ChapterReference: 'ICD-11 Chapter 01 & Chapter 14 (Infectious diseases involving the skin)',
    generalDescription:
      'Dermatological conditions caused by pathogenic microorganisms, including bacterial, fungal, viral, and parasitic agents. In the DermaCon-IN dataset, these encompass common superficial cutaneous infections.',
    clinicalMorphology: [
      'Erythematous papules and pustules',
      'Annular scaling plaques with active advancing borders (tinea)',
      'Crusted vesicular lesions (impetigo, herpes)',
      'Burrows or excoriations (scabies)',
    ],
    representativeConditions: [
      'Tinea corporis / cruris / pedis (Dermatophytosis)',
      'Impetigo and folliculitis (Bacterial)',
      'Herpes simplex and herpes zoster (Viral)',
      'Cutaneous candidiasis (Yeast)',
      'Scabies (Parasitic)',
    ],
    educationalNotes:
      'In clinical practice, definitive diagnosis of infectious dermatoses requires microbiological or microscopic confirmation (e.g., KOH mount, bacterial culture, PCR) rather than visual inspection alone.',
    literatureSources: [
      "Fitzpatrick's Dermatology in General Medicine, 9th ed., Section 28 (Infections and Infestations)",
      'WHO ICD-11 1B40-1F0Z (Infections with cutaneous manifestations)',
    ],
  },

  'Inflammatory Disorders': {
    category: 'Inflammatory Disorders',
    classIndex: 1,
    icd11ChapterReference: 'ICD-11 Chapter 14 (EA80-EA9Z: Dermatitis and eczema; EB00-EB0Z: Papulosquamous)',
    generalDescription:
      'Non-infectious, immune-mediated inflammatory skin conditions characterized by altered epidermal barrier function, dermal lymphocytic infiltration, and neurovascular reactivity.',
    clinicalMorphology: [
      'Pruritic erythematous plaques with lichenification or weeping',
      'Well-demarcated erythematous plaques with silvery scales (psoriasiform)',
      'Polygonal, violaceous flat-topped papules (lichenoid)',
      'Evanescent edematous wheals (urticaria)',
    ],
    representativeConditions: [
      'Atopic dermatitis and contact dermatitis',
      'Plaque psoriasis and guttate psoriasis',
      'Lichen planus',
      'Urticaria and reactive erythemas',
      'Seborrheic dermatitis',
    ],
    educationalNotes:
      'Inflammatory dermatoses share overlapping visual features. Presentation varies substantially across skin tones; erythema often presents as violaceous, hyperpigmented, or grayish-brown discoloration in darker phototypes (FST IV–VI).',
    literatureSources: [
      "Rook's Textbook of Dermatology, 9th ed., Chapter 39 (Eczema, Lichenification and Prurigo)",
      "Fitzpatrick's Dermatology, 9th ed., Part 4 (Disorders Presenting in the Skin and Mucous Membranes)",
    ],
  },

  'Keratanisation Disorders': {
    category: 'Keratanisation Disorders',
    classIndex: 2,
    icd11ChapterReference: 'ICD-11 Chapter 14 (ED00-ED5Z: Disorders of epidermal keratinisation)',
    generalDescription:
      'Disorders characterized by abnormalities in epidermal cornification, desquamation, or stratum corneum turnover, resulting in scaling, hyperkeratosis, and follicular plugging.',
    clinicalMorphology: [
      'Diffuse scaling and stratum corneum thickening (ichthyosiform)',
      'Keratotic follicular papules with central horny plugs',
      'Verrucous or cobblestone-like hyperkeratotic plaques',
      'Palmar or plantar keratoderma',
    ],
    representativeConditions: [
      'Ichthyosis vulgaris and acquired ichthyoses',
      'Keratosis pilaris',
      'Darier disease (Keratosis follicularis)',
      'Palmoplantar keratodermas',
      'Porokeratosis',
    ],
    educationalNotes:
      'Keratinisation disorders frequently have genetic or metabolic underpinnings and often require histopathologic evaluation of skin biopsies for definitive sub-typing.',
    literatureSources: [
      "Fitzpatrick's Dermatology, 9th ed., Chapter 51 (Disorders of Cornification)",
      'ICD-11 ED00-ED5Z (Disorders of epidermal keratinisation)',
    ],
  },

  'Neoplasms and tumors': {
    category: 'Neoplasms and tumors',
    classIndex: 3,
    icd11ChapterReference: 'ICD-11 Chapter 02 (Neoplasms) & Chapter 14 (Skin neoplasms and benign tumors)',
    generalDescription:
      'Abnormal tissue growths of the skin, ranging from common benign lesions (such as seborrheic keratoses and hemangiomas) to premalignant and malignant cutaneous tumors.',
    clinicalMorphology: [
      'Waxy, "stuck-on" pigmented papules and plaques (seborrheic keratosis)',
      'Pearly papules with arborizing telangiectasia (basal cell morphology)',
      'Hyperkeratotic, indurated nodules or non-healing ulcers',
      'Asymmetric macules/patches with pigment variegation and irregular borders',
    ],
    representativeConditions: [
      'Seborrheic keratosis and dermatofibroma (Benign)',
      'Hemangiomas and vascular malformations (Benign)',
      'Actinic keratosis (Pre-malignant)',
      'Basal cell carcinoma and squamous cell carcinoma (Malignant)',
      'Cutaneous melanoma (Malignant)',
    ],
    educationalNotes:
      'CRITICAL SAFETY NOTE: This research prototype cannot rule in or rule out cutaneous malignancy. Suspected neoplasms require in-person evaluation with dermoscopy and histopathologic biopsy by a physician.',
    literatureSources: [
      "Fitzpatrick's Dermatology, 9th ed., Part 8 (Skin Tumors and Proliferative Disorders)",
      'WHO Classification of Skin Tumours, 5th ed. (IARC 2023)',
    ],
  },

  'No Definite Diagnosis': {
    category: 'No Definite Diagnosis',
    classIndex: 4,
    icd11ChapterReference: 'ICD-11 Chapter 21 (Symptoms, signs or clinical findings not elsewhere classified)',
    generalDescription:
      'Clinical images in the DermaCon-IN repository where an unambiguous, consensus diagnostic category was not established during archival curation, or where findings represent non-specific cutaneous variations.',
    clinicalMorphology: [
      'Non-specific macules or mild pigmentary variations',
      'Normal anatomical variants or ambiguous clinical presentations',
      'Atypical non-diagnostic skin features',
    ],
    representativeConditions: [
      'Unresolved diagnostic presentation',
      'Non-specific clinical examination findings',
      'Physiologic variations within normal limits',
    ],
    educationalNotes:
      'This category functions as a closed-world reservoir class within the DermaCon-IN training protocol. It reflects diagnostic uncertainty during dataset creation rather than a clinical disease entity.',
    literatureSources: [
      'DermaCon-IN Dataset Provenance Dossier, Harvard Dataverse (DOI: 10.7910/DVN/W7OUZM)',
      'Phase 01 Project and Data Audit Report (research_reports/PHASE_01_PROJECT_DATA_AUDIT.md)',
    ],
  },

  'Other skin disorders': {
    category: 'Other skin disorders',
    classIndex: 5,
    icd11ChapterReference: 'ICD-11 Chapter 14 (Miscellaneous cutaneous and subcutaneous disorders)',
    generalDescription:
      'Heterogeneous dermatological conditions that do not align with the primary seven clinical categories in the DermaCon-IN taxonomic structure.',
    clinicalMorphology: [
      'Cutaneous ulcerations or atrophy',
      'Subcutaneous nodules or panniculitis',
      'Mucocutaneous or systemic manifestations in the skin',
      'Environmental, physical, or drug-induced dermatoses',
    ],
    representativeConditions: [
      'Connective tissue disease manifestations (Lupus, Scleroderma)',
      'Cutaneous vasculitis and purpura',
      'Drug eruptions (exanthematous, fixed drug eruption)',
      'Metabolic or nutritional skin manifestations',
    ],
    educationalNotes:
      'Because this is a catch-all category, its visual and biological heterogeneity is high. A high score in this category signifies that the image features do not closely align with the more specific classes.',
    literatureSources: [
      "Rook's Textbook of Dermatology, 9th ed., Section 11 (Cutaneous Manifestations of Systemic Disease)",
      'ICD-11 Chapter 14 (Residual and miscellaneous skin disorders)',
    ],
  },

  'Pigmentary Disorders': {
    category: 'Pigmentary Disorders',
    classIndex: 6,
    icd11ChapterReference: 'ICD-11 Chapter 14 (ED60-ED6Z: Disorders of skin pigmentation)',
    generalDescription:
      'Conditions characterized by altered melanin synthesis, distribution, or transfer, presenting as hyperpigmentation, hypopigmentation, or complete depigmentation.',
    clinicalMorphology: [
      'Chalk-white depigmented macules with distinct margins (vitiliginous)',
      'Reticulated, symmetric hyperpigmented facial macules (melasma)',
      'Macular hyper- or hypopigmentation following cutaneous injury or dermatitis',
      'Confluent hyper- or hypopigmented finely scaling macules (pityriasis versicolor)',
    ],
    representativeConditions: [
      'Vitiligo (Autoimmune melanocyte destruction)',
      'Melasma (Acquired hypermelanosis)',
      'Post-inflammatory hyperpigmentation (PIH)',
      'Post-inflammatory hypopigmentation',
      'Pityriasis alba',
    ],
    educationalNotes:
      'Pigmentary disorders represent a focal group in SamaDerma fairness research. Historical test evaluation showed marked observational recall disparity between FST 3 (58.33%) and FST 5 (86.36%). The model outputs this broad group label, not specific underlying pigmentary diagnoses.',
    literatureSources: [
      "Fitzpatrick's Dermatology, 9th ed., Chapter 75 (Hypomelanoses) and Chapter 76 (Hypermelanoses)",
      'ICD-11 ED60-ED6Z (Disorders of skin pigmentation)',
    ],
  },

  'Skin Appendages Disorders': {
    category: 'Skin Appendages Disorders',
    classIndex: 7,
    icd11ChapterReference: 'ICD-11 Chapter 14 (ED80-ED9Z: Disorders of the epidermal appendages)',
    generalDescription:
      'Diseases of the pilosebaceous unit, eccrine or apocrine sweat glands, hair follicles, and nails.',
    clinicalMorphology: [
      'Open and closed comedones, inflammatory papules, and nodules (acneiform)',
      'Centrofacial erythema, telangiectasia, and papulopustules (rosacea)',
      'Recurrent painful inflammatory nodules and sinus tracts in intertriginous folds',
      'Follicular miniaturization or patchy alopecic patches',
    ],
    representativeConditions: [
      'Acne vulgaris',
      'Rosacea',
      'Hidradenitis suppurativa (Acne inversa)',
      'Alopecia areata and androgenetic alopecia',
      'Nail apparatus disorders (Onychopathy)',
    ],
    educationalNotes:
      'Appendageal disorders are among the most frequent reasons for dermatological consultations globally. Inflammatory lesions can trigger secondary post-inflammatory hyperpigmentation, especially in darker skin phototypes.',
    literatureSources: [
      "Fitzpatrick's Dermatology, 9th ed., Chapter 78 (Acne Vulgaris and Acneiform Eruptions)",
      "Rook's Textbook of Dermatology, 9th ed., Chapter 90 (Disorders of the Sebaceous Glands)",
    ],
  },
};

/**
 * Helper to safely retrieve clinical taxonomy information for a category name
 */
export function getDiseaseTaxonomy(categoryName: string): DiseaseCategoryTaxonomy | null {
  return DISEASE_TAXONOMY[categoryName] || null;
}
