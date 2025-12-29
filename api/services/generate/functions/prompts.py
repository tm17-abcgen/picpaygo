"""Prompt templates for different image styles."""

from __future__ import annotations

from typing import Dict

from fastapi import HTTPException


PROMPT_BY_TYPE: Dict[str, str] = {
    # Portraits
    "professional-headshot": """A professional, high-resolution profile photo, maintaining the exact facial structure, identity, and key features of the person in the input image. The subject is framed from the chest up, with ample headroom. The person looks directly at the camera. They are styled for a professional photo studio shoot. The background is a solid neutral studio color. Shot from a high angle with bright and airy soft, diffused studio lighting, gently illuminating the face and creating a subtle catchlight in the eyes, conveying a sense of clarity. Captured on an 85mm f/1.8 lens with a shallow depth of field, exquisite focus on the eyes, and beautiful, soft bokeh. Observe crisp detail on the fabric texture of the blazer, individual strands of hair, and natural, realistic skin texture. The atmosphere exudes confidence, professionalism, and approachability. Clean and bright cinematic color grading with subtle warmth and balanced tones, ensuring a polished and contemporary feel.""",
    "business-portrait": """A cinematic close-up editorial portrait maintaining the exact facial structure, identity, and key features of the person in the input image. The subject is framed from the lower chest up, with ample headroom. They are styled for a professional photo studio shoot, wearing a sleek black suit, dark blazer, and black turtleneck, direct gaze with subtle smirk. The background deep midnight blue with subtle gradient and moody. Bright and airy soft, dramatic cinematic lighting, gently illuminating the face and creating a subtle catchlight in the eyes, conveying a sense of clarity. Captured on an 85mm lens, f/4, ISO 100, shutter 1/200s  with a shallow depth of field, exquisite focus on the eyes, and beautiful, soft bokeh. Observe crisp detail on individual strands of hair, and natural softened skin texture. The atmosphere exudes confidence, professionalism, and approachability. Photography inspired by Annie Leibovitz and Peter Lindbergh.""",
    "90s-point-and-shoot": """Without changing the original face, create a portrait of the subject captured with a 1990s-style camera using a direct front flash. The subject poses with a relaxed demeanor. The background is a dark white wall covered with aesthetic magazine posters and stickers, evoking a cozy bedroom or personal room atmosphere under dim lighting. The 35mm lens flash creates a nostalgic glow.""",
    "canon-ixus-aesthetic": """{
  "image_parameters": {
    "style": "Canon IXUS aesthetic",
    "type": "Point-and-shoot photography",
    "quality": "Hyper-realistic",
    "tone": "Sharp, direct",
    "lighting_and_atmosphere": "Realistic, flash-style/direct lighting"
  },
    "subject": {
    "constraints": {
      "facial_identity": "Strictly preserve facial features",
      "face_edits": "None allowed"
    },
    "hair": {
      "style": "Natural, effortless styling",
      "movement": "Subtle dynamic movement",
      "details": "Textured strands framing the face"
    },
    "makeup": {
      "cheeks_and_nose": "Natural healthy glow",
      "lips": "Softly defined natural tone"
    },
    "expression": [
      "Captivating",
      "Relaxed confidence",
      "Authentic mood",
      "Photogenic charm"
    ],
    "pose": {
      "body_position": "Casual, comfortable stance",
      "action": "Spontaneous interaction with environment"
    },
    "clothing": {
      "top": "Stylish contemporary top",
      "bottom": "Modern fitted bottoms",
      "neck": "Minimalist neck accessory"
    },
    "accessories": [
      "Subtle personal jewelry",
      "Classic wristwear"
    ]
  },
  "environment": {
    "setting": "Dimly lit indoor social atmosphere",
    "foreground_props": [
      "Reflective tabletop surfaces",
      "Glassware",
      "Ambient lifestyle details"
    ]
  }

}""",
    "left-profile": """A closeup photo of the person in the picture looking left in profile view""",
    "right-profile": """A closeup photo of the person in the picture looking right in profile view""",
    # Selfies
    "mirror-selfie-2000s": """{
  {
"description": "The specific person from the provided input image taking a mirror selfie with styled hair and a trendy outfit",
"age": "Consistent with the subject in the input image",
"expression": "Confident and engaging",
"hair": {
"color": "Natural tone",
"style": "Voluminous, textured, and well-groomed"
},
"clothing": {
"top": {
"type": "Fitted casual top",
"color": "Neutral light tone",
"details": "Features a central graphic print or distinct design element"
}
},
"face": {
"preserve_original": true,
"makeup": "Polished, photogenic look with defined features and healthy skin texture"
},
"accessories": {
"jewelry": {
"waistchain": "Subtle metallic body jewelry"
},
"device": {
"type": "Smartphone",
"details": "Decorative case"
}
}
},
  "photography": {
    "camera_style": "early-2000s digital camera aesthetic",
    "lighting": "harsh super-flash with bright blown-out highlights but subject still visible",
    "angle": "mirror selfie",
    "shot_type": "tight selfie composition",
    "texture": "subtle grain, retro highlights, V6 realism, crisp details, soft shadows"
  },
  "background": {
    "setting": "nostalgic early-2000s bedroom",
    "wall_color": "pastel tones",
    "elements": [
      "chunky wooden dresser",
      "CD player",
      "posters of 2000s pop icons",
      "hanging beaded door curtain",
      "cluttered vanity with lip glosses"
    ],
    "atmosphere": "authentic 2000s nostalgic vibe",
    "lighting": "retro"
  }
}""",
    "bathroom-mirror-selfie": """{
  "subject": {
    "description": "The person from the input image taking a bathroom mirror selfie, maintaining the contrast between a soft expression and a confident pose",
    "mirror_rules": "Facing mirror, hips slightly angled, close to mirror filling frame",
    "age": "Consistent with the subject in the input image",

    "expression": {
      "eyes": "Engaging contact with the mirror/camera, consistent with input features",
      "mouth": "Relaxed, photogenic expression (pout or smile) based on input",
      "brows": "Natural expression",
      "overall": "A mix of innocent charm and confident allure"
    },

    "hair": {
      "color": "The subject's original hair color",
      "style": "The subject's original hairstyle (e.g., messy bun, loose strands, or natural texture)"
    },

    "body": {
      "waist": "The subject's natural waistline",
      "silhouette": "Posed to highlight the subject's natural physique and curves",
      "posture": "Confident, slightly angled to accentuate the outfit's fit"
    },

    "clothing": {
      "top": {
        "type": "The subject's original top",
        "color": "Original color",
        "graphic": "Original graphics or patterns (if any)",
        "fit": "Fitted style that complements the subject's physique"
      },
      "bottom": {
        "type": "The subject's original bottoms (skirt, shorts, or pants)",
        "color": "Original color",
        "material": "Original fabric texture",
        "fit": "Form-fitting or styled exactly as worn in the input image"
      }
    },

    "face": {
      "features": "Strictly preserve the subject's original facial features",
      "makeup": "The subject's original makeup look (natural, glam, or bare)"
    }
  },

  "accessories": {
    "headwear": {
      "type": "Any headwear present in the input image",
      "details": "Preserve original details (backward cap, beanie, etc.)"
    },
    "headphones": {
      "type": "Headphones (only if present in input)",
      "position": "Original position"
    },
    "device": {
      "type": "Smartphone",
      "details": "Visible in mirror, held at chest level"
    }
  },

  "photography": {
    "camera_style": "Casual smartphone mirror selfie",
    "quality": "Authentic social media quality, realistic lighting",
    "angle": "Eye-level, straight on mirror",
    "shot_type": "Three-quarter body, close crop",
    "aspect_ratio": "9:16 vertical",
    "texture": "Natural, slightly grainy phone camera aesthetic"
  },

  "background": {
    "setting": "Standard apartment bathroom",
    "style": "Lived-in, relatable bathroom setting (not a luxury studio)",
    "elements": [
      "Tile walls",
      "Bathroom mirror",
      "Sink vanity",
      "Everyday toiletries (skincare, toothbrush)",
      "Towel on hook",
      "Shower curtain edge",
      "Houseplant or small decor items"
    ],
    "atmosphere": "Authentic, cozy, personal space",
    "lighting": "Bright vanity lighting above mirror - flattering but realistic"
  },

  "vibe": {
    "energy": "Playful and confident",
    "mood": "Getting ready, casual content creation",
    "contrast": "Soft facial expression paired with a confident body language",
    "caption_energy": "Casual, flirty, or 'mid-routine' social media update"
  }
}""",
    # Fashion / Editorial
    "studio-vogue-editorial": """Iconic Peter Lindbergh for Vogue Italia photography of the person in the reference image. Neutral gray backdrop. Soft diffused key light. High-end editorial styling. Clear skin detail, elegant expression, subtle shadows. Minimal color tones, refined and tasteful.""",
    # Film / Mood
    "emotional-film": """Keep the facial features of the person in the uploaded image exactly consistent. Style : A cinematic, emotional portrait shot on Kodak Portra 400 film . Setting : An atmospheric, cinematic environment with warm, nostalgic lighting hitting the side of the face. Atmosphere : Apply a subtle film grain and soft focus to create a dreamy, storytelling vibe. Action : The subject is caught in a natural, candid moment, looking slightly away from the camera with a relaxed expression. Details : High quality, depth of field, bokeh background of ambient lights.""",
    # Enhancements (AI Tools)
    "crowd-removal": """Remove all the tourists/people in the background behind the main subject, really only people. Intelligent Fill : Replace them with realistic background elements that logically fit the scene Consistency : Ensure no blurry artifacts or 'smudges' remain. The filled area must have the same grain, focus depth, and lighting as the rest of the photo.""",
    "upscaling": """Upscale to 4K while preserving the original details like color, and contrast of the image.""",
    "restoration": """Fully restore this vintage photograph to pristine high-definition quality. Remove all scratches, dust, creases, and fold lines seamlessly. Intelligently sharpen facial features, eyes, and hair with realistic texture, avoiding plastic smoothing. Correct color cast, fix fading, and reduce noise while maintaining the original photo's authenticity and lighting. Output a clean, sharp, professional 4K image.""",
}


def build_prompt(category: str) -> str:
    prompt = PROMPT_BY_TYPE.get(category)
    if not prompt:
        raise HTTPException(status_code=400, detail="Unsupported type")
    return prompt
