---
name: frontend-design
description: Distinctive, production-grade frontend interfaces that reject generic AI aesthetics through intentional design choices. Use when building new UI, redesigning pages, or improving aesthetics.
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product is, its audience, and its primary job, establish them first. Distinctive design comes from the subject's own world—its materials, instruments, vernacular, and constraints—not from a generic UI kit.

## Process

1. **Write a design plan first.** Before writing code, write a short plan:
   - Base palette: 4 to 6 named hex values (e.g., surface, text, primary accent, subtle border, highlight).
   - Typography: Choose typefaces and roles (e.g., a high-character display face paired with a clean geometric or humanist sans).
   - Layout concept: A quick structural sketch or description.
   - Principles: 2 or 3 design rules specific to this project.
2. **Review the plan against the brief.** Check if your plan looks like the generic version you would build for any similar page. If it does, revise it until it has an unmistakable point of view.
3. **Build.** Implement the code cleanly according to your plan.
4. **Self-critique.** Review the resulting interface against your quality floor and the brief.

## Design Principles

### The hero as a thesis
For web designs, open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a data display, a stark contrast. Avoid default layouts (e.g., centered badge + big headline + three feature cards with icons inside rounded boxes) unless the brief explicitly calls for it.

### Typography carries personality
Use one or two clearly distinct families. Give every text element a deliberate scale, weight, and tracking. Keep line lengths readable (typically under 80 characters for body copy). Avoid generic system-stack defaults when a bespoke choice fits better.

### Structure should carry information
Borders, numbering, layout density, labels, and dividers should encode information rather than serve as empty decoration. Numbered markers belong only on content that is genuinely a sequence.

### Restraint and self-critique
Spend your boldness in one place. Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes. Critique your own work as you build, taking screenshots to review if your environment supports it—a picture is worth 1000 tokens.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand and use. They are design content, not decoration. Bring the same intentionality and minimalism to copywriting that you would bring to spacing and color.

- **Write from the end user's perspective.** Name things by what users will understand in simple language, not by how the system is built (e.g., a user manages notifications, not webhook config).
- **Describe function plainly.** Describe what something is or does in plain terms rather than selling it.
- **Handle failures cleanly.** Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.
- **Keep the tone conversational.** Use plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each written element do exactly one job.

