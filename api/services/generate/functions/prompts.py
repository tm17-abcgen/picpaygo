"""Prompt templates for different image styles."""

from __future__ import annotations

from typing import Dict

from fastapi import HTTPException


PROMPT_BY_TYPE: Dict[str, str] = {
    "editorial-moment": """Use the uploaded photo as the reference. Create a photorealistic editorial photograph capturing an authentic human moment. The subject appears exactly as they are—no beautification, no idealization, no transformation. This is documentary-style portraiture that celebrates real human presence.

Subject: [SPECIFY: age, ethnicity, body type (average/athletic/curvy/slim/plus-size), gender expression, hair texture and color, natural skin tone, visible characteristics]. The subject's actual appearance is central to the image. Do not alter, enhance, or perfect the person's natural features.

Setting & Context: A natural environment or interior space that gives the image narrative context. This is not a blank studio—the background tells part of the story. [SPECIFY: location, time of day, activity]. The setting feels like real life, not a constructed backdrop.

Clothing & Appearance: The person wears realistic, everyday clothing (or specified garments) that fits their natural body and personal style. Styling appears authentic to how they actually dress, not aspirational.

Lighting: Available light or soft natural light that shows texture and authenticity. Golden hour, diffused daylight, or soft interior light. The lighting reveals true skin tone and texture, not beautified. Shadows contain color; highlights show detail. This is how light actually behaves in the world, not studio-controlled perfection.

Expression & Moment: Candid expression captured in an authentic moment. The subject appears unaware of the camera or naturally engaged. Expression shows genuine emotion: thoughtful, peaceful, engaged, amused—whatever is real in the moment. No posed smile, no artificial performance.

Pose & Body Language: Natural body language reflecting authentic human behavior. The person is standing, sitting, moving, or engaged in an actual activity. Posture shows how the body naturally holds itself, including any asymmetries or natural postural habits. This is how the person actually exists in their body.

Appearance Treatment: Unretouched, photojournalistic rendering. Skin shows natural texture, pores, variations in tone. Age is visible as texture and character, not hidden. Hair shows its natural state: texture, volume, the way it actually sits. The body shows its true shape and form—no sucking in, no posturing, no disguising. Wrinkles, freckles, marks, asymmetries are rendered as natural human features.

Camera & Technical: Shot on a professional mirrorless camera (Canon EOS R5, Nikon Z9, or Sony α9) with a 50mm f/1.4 lens at aperture f/2.0. This creates a natural field of view that feels human-scaled, with gentle background separation. The framing is intuitive rather than rigid—subject might be off-center, showing their relationship to their environment.

Film Aesthetic: Rendered as if shot on Kodak Portra 400—warm, generous tonality. Colors are true to life, not manipulated. Slight warmth in shadows and coolness in highlights, suggesting real film rendering. No excessive saturation, no digital look.

Mood & Narrative: The image has quiet dignity and authenticity. It celebrates the person as they actually are, in their actual life. There is no "story of transformation" or "glamour"—just the beauty of genuine human presence.

Quality: High-resolution, photorealistic, suitable for editorial publication. The image should feel like it came from a documentary or lifestyle photographer known for capturing authentic human moments.

Aspect Ratio: 9:16 (vertical, editorial/digital format).

Exclusions: No styling transformation, no makeup enhancement, no skin smoothing, no beautification, no filters, no "perfect," "flawless," or "ideal" language. This is unretouched documentary-style portraiture.""",
    "fashion-editorial": """Use the uploaded photo as the reference. Create a fashion editorial photograph that showcases authentic human presence in stylish clothing. The subject's natural appearance—age, body type, ethnicity, gender expression—is the foundation. Do not transform, idealize, or beautify the person.

Subject: [SPECIFY: age (exact number), ethnicity, body type (slim/athletic/average/curvy/plus-size), gender identity, hair type and natural color, skin tone, any distinctive features]. This person appears as they naturally are. Render their authentic features with photographic honesty.

Styling: Fashion-forward outfit that suits the person's natural build and style—not aspirational or transformative. Include [SPECIFY: garment type, color, material]. The clothing fits naturally and shows the wearer's true silhouette. Styling honors the person's authentic aesthetic, not a "makeover."

Hair & Makeup: Natural, minimal makeup that enhances without transforming. Makeup sits on natural skin, showing texture beneath. Hair is styled with intention but rendered as it naturally grows: if curly, show curl pattern; if fine, show fineness; if thick, show texture. Makeup appears like someone who prepared for a photo, not someone transformed by professionals.

Lighting & Camera: Shot on a Sony α7R IV with an 85mm f/1.4 lens at aperture f/2.0. Natural or soft-window lighting that reveals true skin tone without flattery. If outdoors, use golden hour or overcast light that shows detail in both highlights and shadows. The lighting should feel like available light enhanced subtly, not studio-controlled.

Pose & Expression: Natural pose with authentic body language. The subject is engaged but not performing. Expression is genuine—not smiling unless natural to the moment, but present and real. Include subtle movement cues if posed (turned slightly, weight shifted), not rigidly symmetrical.

Appearance Treatment: Unretouched photographic appearance. Skin shows natural texture, pores, variations in tone. If there are age lines, they are rendered truthfully. Body shows its natural form—no sucking in, no artificial posturing. The person's actual proportions and shape are clearly visible and authentic.

Background: Appropriate environment that gives context: interior space, outdoor location, or studio background that suits the editorial aesthetic. The background should complement, not distract.

Color & Tone: Rendered as if shot on Fujifilm Portra 400—warm, generous color palette. Skin tones are accurate to the person's actual complexion. Colors feel true to life, not oversaturated. Slight warmth in shadows, natural color balance throughout.

Mood: The image celebrates the person as they are—confident, authentic, present. The overall feeling is "editorial feature celebrating this individual" not "transformation or glamorization."

Quality: Editorial magazine-quality photography, high resolution, suitable for professional publication. The image should feel authentic and documentary, not overly polished.

Aspect Ratio: 2:3 (portrait-oriented).

Exclusions: No "makeover," no "glamorous," no "perfect features," no "smooth skin," no "flawless," no "airbrushed," no enhancement of physical appearance beyond authentic styling.""",
    "portrait-honest": """Use the uploaded photo as the reference. Create a portrait photograph that documents human presence with clinical honesty. The subject appears exactly as they are—age, body type, ethnicity, distinctive features all preserved with photographic accuracy. This is portraiture that values truth over flattery.

Subject Demographics: [SPECIFY: age (exact number), ethnicity, body type (slim/average/athletic/curvy/plus-size), gender, hair texture/color, skin tone, notable features]. Render the person with complete authenticity. Do not beautify, smooth, or perfect any aspect of their appearance.

Lighting & Mood: Clinical studio lighting—bright, even, revealing. Key light positioned to illuminate the face fully, creating definition without shadow manipulation. The goal is clear visibility and accuracy, not artistic flattery. Hard light or diffused light, but always revealing texture and truth.

Camera & Technical: Shot on a Hasselblad X1D-50c (or equivalent medium-format quality) with a 110mm f/2 lens. Aperture f/2.8 to keep face sharp. ISO set for fine grain and tonal precision. The image is exceptionally detailed: skin texture, individual hairs, subtle color variations are all visible.

Subject Treatment: The person appears in simple, minimal clothing (white shirt, neutral tones, or no shirt if appropriate to context). The focus is entirely on the human form and face, not styling. Hair is shown in its natural state—color, texture, volume, the way it naturally sits. No styling enhancement.

Appearance & Texture: Uncompromising texture rendering. Skin shows: pores, fine lines, freckles, skin texture variations, natural color, any marks or features. This is not idealized skin—this is real human skin rendered with honesty. Hair shows its actual texture: if curly, show the curl pattern; if thin, show the fineness; if coarse, show the texture.

Age Representation: If the person is older, age is visible and rendered with respect. Wrinkles are documented as character. Age spots, gray hair, lines are rendered authentically. If the person is young, youthful features are shown truthfully, including any imperfections. Age is never hidden; it is documented with photographic precision.

Expression & Presence: Neutral to contemplative expression. The person faces the camera directly. Expression is calm and present, not smiling or performing. Eyes are engaged and aware. The overall impression is one of honest human presence.

Body & Form: If full-body or half-body, the person's natural body is visible. Body type is shown truthfully: proportions, size, shape are documented as they are. No posturing, no hidden angles, no artificial shaping. This is the person's actual form.

Background: Completely plain—white or neutral gray. The background is utterly simple, providing zero context or distraction. The image is entirely about the human being.

Color & Tone: Rendered as if shot on technical film known for accuracy: Kodak Portra 400 or black-and-white Tri-X (or equivalent digital rendering). Colors (if color) are true to life—skin tone is accurate, no artificial warming or cooling. If black-and-white, tonal range is full and detailed.

Post-Processing: Minimal, clinical rendering. No filters, no smoothing, no enhancement. The image is clean and clear, but utterly unretouched. What is rendered is what is actual. Shadows contain detail. Highlights show true exposure. There is no manipulation in service of "beauty."

Quality: Museum-quality photographic print. 8K resolution. The image should feel like a portrait that could be displayed in a photography museum or fine-art collection, valued for its honesty and clarity rather than flattery.

Mood: The image is respectful and dignified. It documents a human being with clinical precision and quiet respect. There is beauty in authenticity and truth.

Aspect Ratio: 1:1 (square).

Exclusions: ABSOLUTELY NO: "beautiful," "perfect," "flawless," "smooth," "idealized," "glamorous," "filtered," "enhanced," "beautification," or any language suggesting improvement or idealization. This is documentary truth, not flattery.""",
    "studio-portrait": """Use the uploaded photo as the reference. Create a studio portrait photograph with 100% preservation of the subject's natural facial features, body type, age, and ethnicity. Do not idealize, stylize, or alter appearance—render the person exactly as they are in real life.

Subject Characteristics: [SPECIFY: exact age, ethnicity, body type (slim/athletic/average/curvy/plus-size), hair texture and color, distinctive features to preserve]. The subject's natural features are the focus, not a transformation. Include age-appropriate details: fine lines, texture variations, natural asymmetries of the face.

Lighting & Camera: Shot on a Canon EOS R5 with a 110mm f/2 portrait lens. Studio setup with soft, directional Rembrandt-style lighting (key light 45 degrees left, creating definition without flattery). The lighting reveals texture: skin shows natural pores and texture, hair shows its actual condition, facial features are rendered with anatomical accuracy. Aperture f/2.5 for selective focus on eyes.

Expression & Pose: Natural, contemplative expression—not smiling, not performing. The person appears present and calm, looking directly at camera. Body language is relaxed and authentic. No artificial tension or posed elegance.

Appearance Treatment: Natural skin texture with visible pores and subtle variations in tone. No airbrushing, no smoothing, no skin perfection. If there are wrinkles, age spots, or freckles, they are rendered with photographic accuracy as natural features. Hair shows its natural state: texture, flyaway strands, the way it actually sits.

Background: Neutral gray-white, completely plain. The background provides no distraction—the focus is entirely on authentic human presence.

Post-Processing: Minimal, clean digital rendering. Color graded to match natural daylight film stock (Kodak Portra 400 aesthetic). Natural shadows contain color and transparency, not pure black. No excessive contrast, no filters, no digital artifact.

Quality: 8K photorealistic, archive-quality portrait photography. The image should feel like a professional photograph from a skilled portrait photographer who values human authenticity over idealization.

Aspect Ratio: 1:1 (square).

Exclusions: No "beautification," no "filter," no "smooth skin," no "perfect," no "flawless," no "airbrushed," no "model-like," no artificial enhancement of any kind.""",
}


def build_prompt(category: str) -> str:
    prompt = PROMPT_BY_TYPE.get(category)
    if not prompt:
        raise HTTPException(status_code=400, detail="Unsupported type")
    return prompt
