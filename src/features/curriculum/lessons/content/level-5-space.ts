import type { Lesson } from "../schema";

export const LEVEL_5_SPACE_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M5SP01: Three-Dimensional Objects and Net Construction
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5SP01",
    title: "3D Objects, Prisms, Pyramids and Nets",
    strand: "space",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to connect three-dimensional objects with their two-dimensional nets and analyze their properties (faces, edges, vertices).",
    successCriteria: [
      "I can distinguish between prisms (two identical parallel bases with rectangular sides) and pyramids (one base meeting at an apex).",
      "I can visualize, construct, and verify 2D nets that fold into 3D prisms and pyramids.",
      "I can apply Euler's characteristic (Faces + Vertices - Edges = 2) to check the properties of convex polyhedra.",
    ],
    prerequisites: ["VC2M3SP01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Space).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5sp01-concept",
        heading: "Classifying Polyhedra and Their Folding Nets",
        explanation:
          "A polyhedron is a solid 3D shape with flat polygon faces, straight edges, and sharp corners (vertices).\n\nTwo main families of polyhedra:\n• Prisms: Have two identical parallel end faces (bases). All other connecting faces are rectangles or parallelograms. Prisms are named after the shape of their base (e.g. Triangular prism, Rectangular prism, Hexagonal prism).\n• Pyramids: Have one polygon base, and all other faces are triangles that meet at a single shared point called the apex (e.g. Square-based pyramid, Triangular pyramid/tetrahedron).\n\nA net is a flat 2D pattern of connected polygon faces that can be folded along its edges to form a 3D object without overlapping or missing faces.",
        keyTerms: [
          {
            term: "Polyhedron",
            definition: "A three-dimensional solid with flat polygon faces and straight edges.",
          },
          {
            term: "Prism",
            definition: "A solid with two identical, parallel bases connected by rectangular side faces.",
          },
          {
            term: "Pyramid",
            definition: "A solid with a polygon base and triangular sides that meet at an apex.",
          },
          {
            term: "Net",
            definition: "A two-dimensional unfolding of a 3D solid that can be folded to recreate the shape.",
          },
        ],
        visualAsset: {
          id: "vc2m5sp01-polyhedra-table",
          type: "table",
          altText: "Comparison table of common 3D polyhedra showing faces, edges, vertices, and base shapes.",
          title: "Properties of Common 3D Polyhedra",
          data: {
            headers: ["3D Solid", "Base Shape", "Faces (F)", "Vertices (V)", "Edges (E)", "F + V - E"],
            rows: [
              ["Cube", "Square", "6", "8", "12", "6 + 8 - 12 = 2"],
              ["Triangular Prism", "Triangle", "5", "6", "9", "5 + 6 - 9 = 2"],
              ["Square Pyramid", "Square", "5", "5", "8", "5 + 5 - 8 = 2"],
              ["Hexagonal Prism", "Hexagon", "8", "12", "18", "8 + 12 - 18 = 2"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5sp01-example",
        heading: "Worked Example: Analyzing a Triangular Prism Net",
        problem:
          "A triangular prism has an equilateral triangle base with sides of 5 cm, and a prism height of 10 cm. How many faces, edges, and vertices does it have, and what shapes must its net contain?",
        steps: [
          {
            stepNumber: 1,
            label: "Identify the base faces",
            working: "A triangular prism has 2 identical triangular bases (top and bottom).",
            why: "Prisms are defined by their two matching end faces.",
          },
          {
            stepNumber: 2,
            label: "Identify the connecting side faces",
            working: "Because the base has 3 edges, there are 3 rectangular lateral faces connecting the two triangles.",
            why: "Each side of the polygon base connects to a rectangular face.",
          },
          {
            stepNumber: 3,
            label: "Determine total faces, edges, and vertices",
            working:
              "• Faces = 2 triangles + 3 rectangles = 5 faces\n• Vertices = 3 at top + 3 at bottom = 6 vertices\n• Edges = 3 on top triangle + 3 on bottom triangle + 3 vertical pillars = 9 edges.",
            why: "Systematic counting across bases and sides ensures no features are omitted.",
          },
          {
            stepNumber: 4,
            label: "Specify the required net components",
            working: "The net must consist of 3 rectangles joined side-by-side (each 5 cm × 10 cm) with 2 triangles (base 5 cm) attached to opposite edges.",
            why: "When folded around the triangular bases, the rectangles form the lateral tube.",
          },
        ],
        finalAnswer: "The triangular prism has 5 faces, 6 vertices, and 9 edges. Its net contains 2 triangles and 3 rectangles.",
        commonError: {
          mistake: "Drawing a net with triangles that fold onto the exact same side, leaving one end open.",
          whyItHappens: "Failing to visualize the folding process in 3D.",
          howToAvoid: "Ensure the two base triangles attach to opposite sides or fold into opposite ends of the prism.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5sp01-misconception",
        heading: "Misconception: Any Arrangement of 6 Squares Forms a Cube Net",
        claim: "Any flat pattern containing 6 connected squares will fold into a cube.",
        whyWrong:
          "There are only 11 unique valid nets of a cube. If squares are placed in a 2×3 block or if two squares fold onto the same face, they will overlap, leaving another face open.",
        correction:
          "Test the net mentally or by cutting it out to verify that every face folds to a distinct side without overlapping.",
        example: "A T-shape or cross shape with 6 squares folds into a cube, but a 2×3 rectangle does not.",
      },
      {
        kind: "check",
        id: "vc2m5sp01-check",
        heading: "Check Your Understanding",
        prompt: "Practise identifying 3D objects, matching them to 2D nets, and counting faces, edges, and vertices.",
        curriculumCode: "VC2M5SP01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M5SP02: Grid Coordinate Systems and Directional Navigation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5SP02",
    title: "Cartesian Coordinates and Grid Navigation",
    strand: "space",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to plot and read coordinates in the first quadrant of the Cartesian plane (x, y) and describe pathways using directional language and compass bearings.",
    successCriteria: [
      "I can identify the x-axis (horizontal), y-axis (vertical), and origin (0, 0).",
      "I can plot and read ordered pairs (x, y) by moving 'along the corridor, then up the stairs'.",
      "I can describe movement along a grid using compass directions (N, S, E, W, NE, NW, SE, SW) and coordinate changes.",
    ],
    prerequisites: ["VC2M3SP02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Space).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5sp02-concept",
        heading: "The First Quadrant Coordinate System",
        explanation:
          "A Cartesian coordinate grid uses two perpendicular number lines that meet at a starting point called the origin (0, 0):\n• x-axis: The horizontal number line running left to right.\n• y-axis: The vertical number line running bottom to top.\n\nEvery position on the grid is defined by an ordered pair: (x, y).\n• The first number (x) tells you how far to move along the horizontal axis.\n• The second number (y) tells you how far to move up the vertical axis.\n• Memory aid: 'Along the corridor (x), then up the stairs (y)'.\n\nNavigation combining coordinates and compass bearings:\n• Moving East increases the x-coordinate.\n• Moving West decreases the x-coordinate.\n• Moving North increases the y-coordinate.\n• Moving South decreases the y-coordinate.",
        keyTerms: [
          {
            term: "Ordered Pair",
            definition: "A pair of numbers (x, y) used to locate an exact point on a coordinate plane.",
          },
          {
            term: "Origin",
            definition: "The point (0, 0) where the horizontal and vertical axes intersect.",
          },
          {
            term: "x-coordinate",
            definition: "The first value in an ordered pair, showing horizontal distance from the origin.",
          },
          {
            term: "y-coordinate",
            definition: "The second value in an ordered pair, showing vertical distance from the origin.",
          },
        ],
        visualAsset: {
          id: "vc2m5sp02-grid",
          type: "coordinate_grid",
          altText: "Coordinate grid showing points plotted in the first quadrant: Home at (2, 3), School at (6, 7), and Park at (8, 2).",
          title: "First Quadrant Map: (x, y) Positions",
          data: {
            xRange: [0, 10],
            yRange: [0, 10],
            gridStep: 1,
            points: [
              { x: 0, y: 0, label: "Origin (0,0)" },
              { x: 2, y: 3, label: "Home (2,3)" },
              { x: 6, y: 7, label: "School (6,7)" },
              { x: 8, y: 2, label: "Park (8,2)" },
            ],
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m5sp02-example",
        heading: "Worked Example: Plotting and Navigating Coordinates",
        problem:
          "Starting at Home (2, 3), a student walks 4 units East and 4 units North to reach School. What are the coordinates of the School? Then, they walk 2 units East and 5 units South to the Park. What are the coordinates of the Park?",
        steps: [
          {
            stepNumber: 1,
            label: "Calculate the School coordinates from Home (2, 3)",
            working:
              "• Walking East increases x by 4: x = 2 + 4 = 6.\n• Walking North increases y by 4: y = 3 + 4 = 7.\nSchool coordinates = (6, 7).",
            why: "East adds to the horizontal x-axis; North adds to the vertical y-axis.",
          },
          {
            stepNumber: 2,
            label: "Calculate the Park coordinates from School (6, 7)",
            working:
              "• Walking East increases x by 2: x = 6 + 2 = 8.\n• Walking South decreases y by 5: y = 7 - 5 = 2.\nPark coordinates = (8, 2).",
            why: "South moves downwards along the y-axis, requiring subtraction from y.",
          },
        ],
        finalAnswer: "School is at (6, 7); Park is at (8, 2).",
        commonError: {
          mistake: "Writing (y, x) instead of (x, y) — for example, plotting (3, 2) instead of (2, 3).",
          whyItHappens: "Reading the vertical axis before the horizontal axis.",
          howToAvoid: "Remember alphabetical order: x comes before y in the alphabet, and x comes first in (x, y).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5sp02-misconception",
        heading: "Misconception: Points on Axes Have Only One Coordinate",
        claim: "A point lying directly on the x-axis or y-axis only needs one number (like '5').",
        whyWrong:
          "Every point on a 2D coordinate plane must have both an x and a y coordinate. If a point is 5 units along the x-axis and doesn't move up, its coordinate is (5, 0). If it is on the y-axis 4 units up, it is (0, 4).",
        correction:
          "Always write ordered pairs with two numbers inside brackets, using 0 when a coordinate sits directly on an axis.",
        example: "The origin is (0, 0), not just 0.",
      },
      {
        kind: "check",
        id: "vc2m5sp02-check",
        heading: "Check Your Understanding",
        prompt: "Practise plotting points, reading coordinates in the first quadrant, and describing grid navigation pathways.",
        curriculumCode: "VC2M5SP02",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. VC2M5SP03: Transformational Geometry: Translations, Reflections, Rotations
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M5SP03",
    title: "Transformational Geometry: Translate, Reflect, Rotate",
    strand: "space",
    level: "Level 5",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to describe and perform geometric transformations (translations, reflections, and rotations) and identify line and rotational symmetry.",
    successCriteria: [
      "I can perform a translation (slide) and describe it in terms of units left/right and up/down.",
      "I can perform a reflection (flip) across a vertical, horizontal, or diagonal line of symmetry.",
      "I can perform a rotation (turn) around a centre of rotation by 90°, 180°, or 270° clockwise or anticlockwise.",
    ],
    prerequisites: ["VC2M5SP02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 5 Mathematics (Space).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m5sp03-concept",
        heading: "Three Fundamental Rigid Transformations",
        explanation:
          "Transformations move or change a 2D shape on a plane. In rigid transformations (isometries), the shape keeps its exact size and shape (it remains congruent):\n\n1. Translation (Slide): Every vertex moves the exact same distance in the exact same direction (e.g. 3 units right, 2 units up). Orientation and face direction stay unchanged.\n2. Reflection (Flip): The shape flips across a mirror line (axis of reflection). Every point on the image is the same perpendicular distance from the line as the original point, but the orientation is reversed.\n3. Rotation (Turn): The shape turns around a fixed point (centre of rotation) by a specific angle (e.g. 90° clockwise, 180°).\n\n• Line Symmetry: A line dividing a shape into two identical mirror-image halves.\n• Rotational Symmetry: A shape has rotational symmetry if it looks identical to its starting position more than once in a full 360° rotation (order of rotational symmetry).",
        keyTerms: [
          {
            term: "Translation",
            definition: "Sliding a shape in any direction without turning or flipping it.",
          },
          {
            term: "Reflection",
            definition: "Flipping a shape across a line of reflection to create a mirror image.",
          },
          {
            term: "Rotation",
            definition: "Turning a shape around a fixed centre point by a specified angle and direction.",
          },
          {
            term: "Congruent",
            definition: "Having the exact same shape and size (angles and side lengths are identical).",
          },
        ],
      },
      {
        kind: "worked_example",
        id: "vc2m5sp03-example",
        heading: "Worked Example: Applying a Coordinate Translation",
        problem:
          "Triangle ABC has vertices at A(1, 2), B(4, 2), and C(1, 6). The triangle is translated 3 units right and 2 units down to form Triangle A'B'C'. Find the coordinates of the new vertices.",
        steps: [
          {
            stepNumber: 1,
            label: "Translate vertex A(1, 2)",
            working: "• New x: 1 + 3 = 4\n• New y: 2 - 2 = 0\nVertex A' = (4, 0).",
            why: "Translating right adds to x; translating down subtracts from y.",
          },
          {
            stepNumber: 2,
            label: "Translate vertex B(4, 2)",
            working: "• New x: 4 + 3 = 7\n• New y: 2 - 2 = 0\nVertex B' = (7, 0).",
            why: "Applying the same transformation rule preserves side length AB = 3.",
          },
          {
            stepNumber: 3,
            label: "Translate vertex C(1, 6)",
            working: "• New x: 1 + 3 = 4\n• New y: 6 - 2 = 4\nVertex C' = (4, 4).",
            why: "Preserves the vertical side AC = 4.",
          },
        ],
        finalAnswer: "The new vertices are A'(4, 0), B'(7, 0), and C'(4, 4).",
        commonError: {
          mistake: "Adding 2 to y instead of subtracting when moving down.",
          whyItHappens: "Confusing upward motion (positive) with downward motion (negative).",
          howToAvoid: "Remember: Up = add to y, Down = subtract from y, Right = add to x, Left = subtract from x.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m5sp03-misconception",
        heading: "Misconception: Rotations and Reflections Change Shape Area",
        claim: "Flipping or turning a shape changes its perimeter or area.",
        whyWrong:
          "Translations, reflections, and rotations are rigid isometries. They preserve all side lengths, angles, and enclosed area. The resulting image is 100% congruent to the original shape.",
        correction:
          "Transformations only change position or orientation, never size or shape.",
        example: "A book placed upside down or seen in a mirror has the exact same dimensions.",
      },
      {
        kind: "check",
        id: "vc2m5sp03-check",
        heading: "Check Your Understanding",
        prompt: "Practise performing and describing translations, reflections, and rotations on shapes and grids.",
        curriculumCode: "VC2M5SP03",
        practiceCount: 5,
      },
    ],
  },
]);
