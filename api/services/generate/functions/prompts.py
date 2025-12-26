"""Prompt templates for different image styles."""

from __future__ import annotations

from typing import Dict

from fastapi import HTTPException


PROMPT_BY_TYPE: Dict[str, str] = {
    # Portraits
    "professional-headshot": """Use the uploaded photo as the reference. Create a clean, modern professional headshot with flattering natural light, natural skin tone, and a confident, approachable expression.

Subject: [SPECIFY: age, ethnicity, body type, gender expression, hair texture and color, natural skin tone]. The subject's actual appearance is preserved—no beautification or idealization.

Lighting & Camera: Shot on a Canon EOS R5 with an 85mm f/1.4 lens at aperture f/2.0. Soft, professional studio lighting with a key light and subtle fill. Natural skin texture preserved.

Expression & Pose: Confident, approachable expression. Direct eye contact with camera. Natural head position—slightly tilted is fine. Professional but authentic posture.

Background: Neutral or simple professional background (white, gray, or muted solid color). Clean, uncluttered.

Quality: High-resolution, photorealistic, suitable for LinkedIn and professional use.

Aspect Ratio: 2:3 (portrait-oriented).""",
    "business-portrait": """Use the uploaded photo as the reference. Create a corporate business portrait with formal wardrobe styling, crisp contrast, and a composed, leadership-leaning vibe.

Subject: [SPECIFY: age, ethnicity, body type, gender, professional appearance]. Render the person with photographic honesty while conveying authority and competence.

Styling: Business formal attire—dark suit (black or navy), crisp white shirt, tie optional. Clothing fits naturally. Professional appearance without being stiff or overly formal.

Lighting & Camera: Shot on a Sony α7R IV with a 90mm f/2.8 lens. Classic corporate lighting—soft key light with subtle rim light for separation. Clean, professional contrast.

Expression & Pose: Confident, composed expression. Direct engagement with camera. Posture suggests leadership and capability.

Background: Professional environment or neutral backdrop. Subtle context suggesting office or studio.

Quality: Corporate headshot quality, suitable for website, LinkedIn, and press materials.

Aspect Ratio: 2:3 (portrait-oriented).""",
    "90s-point-and-shoot": """Use the uploaded photo as the reference. Create a 90s-inspired point-and-shoot photograph with direct flash aesthetic, softer detail, and nostalgic color/contrast.

Subject: [SPECIFY: age, ethnicity, style, gender]. Casual, authentic 90s appearance.

Lighting: Direct on-camera flash look—harsh but nostalgic. Slight overexposure highlights, warm color cast typical of 90s compact cameras.

Camera: Simulated point-and-shoot look—slightly soft focus, film grain, muted saturation with warm shift.

Styling: Casual 90s fashion—denim, t-shirts, flannel, or casual dresses. Authentic to the era.

Background: Everyday 90s environment—indoor, casual spaces, or outdoor with that snapshot aesthetic.

Quality: Snapshot quality—feels like a real 90s point-and-shoot photo, not polished.

Aspect Ratio: 3:4 (classic point-and-shoot format).""",
    "canon-ixus-aesthetic": """Use the uploaded photo as the reference. Create an early 2000s compact digital photograph with bright flash aesthetic, punchy color, and that distinctive "digital snapshot" character.

Subject: [SPECIFY: age, ethnicity, casual style, gender]. Authentic early-2000s appearance.

Lighting: Bright compact camera flash—slightly blown out highlights, characteristic digital flash look.

Camera: Simulated Canon IXUS/PowerShot look—slight digital noise, punchy oversaturated colors, that early 2000s digital character.

Styling: Casual Y2K-era fashion—authentic to the time period.

Background: Everyday casual spaces, mirrors, or snapshot environments.

Quality: Early digital snapshot aesthetic—not polished, authentic to the technology.

Aspect Ratio: 3:4 (compact digital format).""",
    "left-profile": """Use the uploaded photo as the reference. Create a left profile portrait showing the subject's left side—useful for consistent angle studies and side-view composition.

Subject: [SPECIFY: age, ethnicity, distinctive profile features, gender]. Render the profile with anatomical accuracy.

Lighting & Camera: Shot on a Canon EOS R5 with a 100mm f/2.8 lens. Classic profile lighting—soft, directional light that defines the profile features. Gentle shadow on the camera-left side.

Pose: Subject turned to show full left profile. Natural head angle—slightly up or down is fine for character.

Background: Clean, neutral background that doesn't distract from the profile silhouette.

Quality: High-resolution profile photography suitable for consistent portfolio or study use.

Aspect Ratio: 2:3 (portrait-oriented).""",
    "right-profile": """Use the uploaded photo as the reference. Create a right profile portrait showing the subject's right side—paired with left profile for symmetry and comparison.

Subject: [SPECIFY: age, ethnicity, distinctive profile features, gender]. Render the profile with anatomical accuracy.

Lighting & Camera: Shot on a Canon EOS R5 with a 100mm f/2.8 lens. Classic profile lighting—soft, directional light that defines the profile features. Gentle shadow on the camera-right side.

Pose: Subject turned to show full right profile. Natural head angle—slightly up or down is fine for character.

Background: Clean, neutral background that doesn't distract from the profile silhouette.

Quality: High-resolution profile photography suitable for consistent portfolio or study use.

Aspect Ratio: 2:3 (portrait-oriented).""",
    # Selfies
    "mirror-selfie-2000s": """Use the uploaded photo as the reference. Create a Y2K-era mirror selfie with playful early-2000s energy—flashy, casual framing, and authentic mirror reflection.

Subject: [SPECIFY: age, ethnicity, gender, Y2K style]. Authentic early-2000s appearance and styling.

Setting: Bathroom mirror or dressing mirror reflection—visible mirror edge, camera/phone visible or implied.

Lighting: Bright bathroom lighting or flash—slightly blown out, characteristic of the era.

Styling: Y2K fashion—low-rise jeans, baby tees, butterfly clips, frosted lip gloss. Authentic to the time.

Pose: Casual selfie pose—arm slightly extended holding camera, candid feeling, not overly posed.

Quality: Mirror selfie aesthetic—feels like a real photo from the early 2000s.

Aspect Ratio: 3:4 (vertical phone camera format).""",
    "bathroom-mirror-selfie": """Use the uploaded photo as the reference. Create an informal bathroom mirror selfie with realistic lighting, tight spaces, and candid authentic styling.

Subject: [SPECIFY: age, ethnicity, gender, casual style]. Authentic, unstyled appearance.

Setting: Bathroom mirror—visible mirror edges, bathroom context (sink, towels, etc).

Lighting: Realistic bathroom lighting—overhead or side mirror lighting, natural or artificial.

Styling: Completely casual—everyday clothing, no styling, authentic to real life.

Pose: Casual selfie pose—arm extended with camera/phone, candid expression, authentic to the moment.

Quality: Informal snapshot quality—feels like a real mirror selfie, not polished.

Aspect Ratio: 3:4 (vertical phone format).""",
    # Fashion / Editorial
    "victorias-secret-shoot": """Use the uploaded photo as the reference. Create a lingerie/glam studio photograph with soft yet polished lighting, confident posing, and a glossy finish. The subject's natural appearance is the foundation—no transformation or idealization.

Subject: [SPECIFY: age, ethnicity, body type, gender]. Render authentic features with glossy magazine styling.

Styling: Lingerie or glam styling—authentic to the person's natural build. Clothing fits naturally, not forced.

Lighting & Camera: Shot on a Sony α7R IV with an 85mm f/1.4 lens at f/2.0. Soft polished studio lighting—glamour setup with flattering but honest light.

Pose & Expression: Confident, empowered posing. Expression is strong and self-assured.

Background: Studio environment—seamless or simple set that complements without distraction.

Color & Tone: Glossy magazine aesthetic—slightly polished but authentic skin texture.

Quality: High-fashion studio quality, suitable for commercial use.

Aspect Ratio: 2:3 (portrait-oriented).""",
    "studio-vogue-editorial": """Use the uploaded photo as the reference. Create an editorial studio photograph with high-fashion posing, strong styling direction, and magazine-ready lighting. The subject's natural appearance is celebrated.

Subject: [SPECIFY: age, ethnicity, body type, gender]. Authentic appearance serves as the foundation.

Styling: High-fashion editorial styling—bold, directional, authentic to the person.

Lighting & Camera: Shot on a Canon EOS R5 with a 50mm f/1.2 lens. Editorial studio lighting—dramatic, directional, magazine-quality.

Pose & Expression: High-fashion posing—strong, intentional, editorial. Expression conveys mood and narrative.

Background: Studio set or simple backdrop that serves the editorial concept.

Color & Tone: Magazine-ready color—rich but authentic, editorial aesthetic.

Quality: Studio Vogue editorial quality—suitable for high-fashion publication.

Aspect Ratio: 2:3 (portrait-oriented).""",
    # Film / Mood
    "emotional-film": """Use the uploaded photo as the reference. Create an emotional film photograph with grain, softer highlights, and color treatment aimed at storytelling and feeling.

Subject: [SPECIFY: age, ethnicity, mood, gender]. Authentic appearance serves emotional narrative.

Lighting & Mood: Cinematic lighting—soft, moody, emotional. Golden hour or overcast natural light.

Camera & Film: Shot on a Canon AE-1 with Kodak Portra 400 or similar. Film grain visible, softer highlight transitions, color character that tells a story.

Expression & Pose: Emotional, storytelling expression. Natural body language that conveys mood.

Background: Environment that supports the emotional narrative—meaningful context.

Color & Tone: Filmic color—warm shadows, soft highlights, emotional color grading.

Quality: Cinematic film photography quality—feels like a still from a film.

Aspect Ratio: 2:3 (portrait format) or 16:9 (cinematic).""",
    # Enhancements (AI Tools)
    "crowd-removal": """Use the uploaded photo as the reference. Remove unwanted people and background clutter while keeping the scene looking natural.

Process: Carefully identify and remove unwanted people/objects from the background. Maintain natural lighting, shadows, and scene continuity.

Output: The main subject remains unchanged. Background is cleaned up naturally—no artifacts, no obvious editing痕迹.

Quality: Seamless result that looks unedited—natural scene maintenance.""",
    "upscaling": """Use the uploaded photo as the reference. Increase resolution while preserving natural textures and image quality.

Process: Upscale the image to higher resolution (2x or 4x). Maintain natural textures, avoid artificial sharpening, preserve the original look and feel.

Output: Higher resolution version with the same aesthetic—no texture loss, no artificial enhancement.

Quality: Professional upscaling that preserves the original image character.""",
    "restoration": """Use the uploaded photo as the reference. Repair older or damaged images (scratches, noise, fading) while keeping a believable result.

Process: Remove scratches, dust, and noise. Restore faded colors and contrast. Maintain the original character and period-appropriate aesthetic.

Output: Cleaned, restored version that looks authentic to the original—no over-restoration, no artificial modernization.

Quality: Professional restoration that respects the original photograph.""",
}


def build_prompt(category: str) -> str:
    prompt = PROMPT_BY_TYPE.get(category)
    if not prompt:
        raise HTTPException(status_code=400, detail="Unsupported type")
    return prompt
