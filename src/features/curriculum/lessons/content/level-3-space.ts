import type { Lesson } from "../schema";

export const LEVEL_3_SPACE_LESSONS: readonly Lesson[] = Object.freeze([
  // ---------------------------------------------------------------------------
  // 1. VC2M3SP01: 3D Objects (Faces, Edges, Vertices)
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3SP01",
    title: "3D Objects: Faces, Edges, Vertices and Prisms",
    strand: "space",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to identify, describe and classify three-dimensional objects using their geometric properties (faces, edges, and vertices).",
    successCriteria: [
      "I can identify and count the flat faces, curved surfaces, straight edges, and vertices (corners) on 3D objects.",
      "I can distinguish between prisms (which have identical opposite polygon bases and rectangular side faces) and pyramids (which taper to an apex point).",
      "I can classify common 3D objects including cubes, rectangular prisms, triangular prisms, cylinders, cones, and spheres.",
    ],
    prerequisites: ["VC2M3N02"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Space).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3sp01-concept",
        heading: "Features of Three-Dimensional Objects",
        explanation:
          "Three-dimensional (3D) objects have three dimensions: length, width, and height. They take up physical space and are classified by their geometric features:\n\n• **Face:** A flat 2D shape that forms a boundary of the solid (e.g. a square face on a cube).\n• **Curved Surface:** A curved boundary that is not flat (e.g. the rounded surface of a cylinder or sphere).\n• **Edge:** The straight line segment where two flat faces meet.\n• **Vertex (plural: Vertices):** The sharp corner point where three or more edges meet.\n\n**Prisms vs Pyramids:**\n• **Prisms:** Have two identical, parallel 2D ends (called bases) connected by rectangular sides. A triangular prism has 2 triangle ends and 3 rectangular sides.\n• **Pyramids:** Have one polygon base on the bottom, and all triangular side faces slope upward to meet at a single top point (apex).",
        keyTerms: [
          {
            term: "Face",
            definition: "An individual flat 2D surface on a three-dimensional solid.",
          },
          {
            term: "Edge",
            definition: "The straight line where two faces of a 3D object meet.",
          },
          {
            term: "Vertex",
            definition: "The corner point where edges meet on a 3D shape (plural: vertices).",
          },
          {
            term: "Prism",
            definition: "A 3D solid with two identical opposite bases and rectangular side faces.",
          },
        ],
        visualAsset: {
          id: "vc2m3sp01-3d-features-table",
          type: "table",
          altText:
            "Table comparing 3D objects with their number of faces, edges, vertices, and base shapes.",
          title: "3D Geometric Solid Feature Comparison",
          data: {
            headers: ["Object Name", "Flat Faces", "Curved Surfaces", "Straight Edges", "Vertices", "Shape of Faces"],
            rows: [
              ["Cube", "6", "0", "12", "8", "6 identical squares"],
              ["Rectangular Prism", "6", "0", "12", "8", "6 rectangles (or 4 rectangles + 2 squares)"],
              ["Triangular Prism", "5", "0", "9", "6", "2 triangles + 3 rectangles"],
              ["Square-based Pyramid", "5", "0", "8", "5", "1 square base + 4 triangles"],
              ["Cylinder", "2", "1", "0 straight (2 curved)", "0", "2 circular flat bases + 1 curved body"],
              ["Cone", "1", "1", "0 straight (1 curved)", "1 apex", "1 circular base + 1 curved surface to apex"],
              ["Sphere", "0", "1", "0", "0", "1 continuous curved surface"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3sp01-example",
        heading: "Worked Example: Identifying a Mystery 3D Object",
        problem:
          "A mystery 3D solid has exactly 5 flat faces (2 are triangles and 3 are rectangles), 9 straight edges, and 6 vertices. Name the 3D solid and describe its structure.",
        steps: [
          {
            stepNumber: 1,
            label: "Inspect the flat faces",
            working:
              "The solid has 5 flat faces: 2 triangles and 3 rectangles. It has zero curved surfaces.",
            why: "The shapes of the faces reveal whether the object is a prism, pyramid, or curved solid.",
          },
          {
            stepNumber: 2,
            label: "Check for prism or pyramid properties",
            working:
              "Because it has two identical triangle ends that are parallel to each other and connected by 3 rectangles, it is a prism named after its triangular base.",
            why: "Prisms have identical end bases connected by rectangular lateral faces.",
          },
          {
            stepNumber: 3,
            label: "Verify edges and vertices",
            working:
              "Edges: 3 on top triangle + 3 on bottom triangle + 3 vertical connecting edges = 9 edges. Vertices: 3 corners on top + 3 corners on bottom = 6 vertices.",
            why: "Checking edge and vertex counts confirms the geometric identity.",
          },
          {
            stepNumber: 4,
            label: "State the conclusive name",
            working:
              "The solid is a TRIANGULAR PRISM (e.g. the shape of a classic camping tent or chocolate box).",
            why: "Naming the prism after its base polygon completes the classification.",
          },
        ],
        finalAnswer:
          "The mystery solid is a TRIANGULAR PRISM. It has 5 faces (2 triangles, 3 rectangles), 9 edges, and 6 vertices.",
        commonError: {
          mistake: "Calling it a 'triangular pyramid' because it has triangle faces.",
          whyItHappens:
            "Students see the word 'triangle' and confuse prisms with pyramids.",
          howToAvoid:
            "Look at the rectangular sides: prisms have rectangular sides connecting two bases; pyramids have triangles meeting at a single top point.",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3sp01-misconception",
        heading: "Common Trap: Confusing 2D Shapes with 3D Solids",
        claim: "A cardboard packing box is a square.",
        whyWrong:
          "A square is a flat, two-dimensional shape with only length and width (0 depth). A cardboard box has thickness and depth, holding objects inside.",
        correction:
          "A box is a three-dimensional object (a cube or rectangular prism). Its flat sides are squares or rectangles.",
        example: "A piece of paper flat on a desk is 2D-like, but a book with height is a 3D rectangular prism.",
      },
      {
        kind: "check",
        id: "vc2m3sp01-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise counting faces, edges, and vertices and classifying cubes, prisms, pyramids, and cylinders.",
        curriculumCode: "VC2M3SP01",
        practiceCount: 5,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. VC2M3SP02: Grid Maps and Spatial Navigation
  // ---------------------------------------------------------------------------
  {
    curriculumCode: "VC2M3SP02",
    title: "Grid Maps: Coordinates, Alpha-Numeric Grids and Directional Pathways",
    strand: "space",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention:
      "We are learning to locate positions on a grid map using alpha-numeric coordinates (e.g. B4) and describe navigation pathways using compass directions (N, S, E, W).",
    successCriteria: [
      "I can read alpha-numeric coordinates by reading the horizontal column letter first, then the vertical row number (e.g. C3).",
      "I can locate an object in a grid square or at a grid intersection.",
      "I can use compass directions (North, South, East, West) and steps to describe a pathway from one location to another.",
    ],
    prerequisites: ["VC2M3SP01"],
    status: "published",
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-30T00:00:00.000Z",
      originalityStatement:
        "100% original pedagogical text, worked examples, and misconceptions authored specifically for Victorian Curriculum Level 3 Mathematics (Space).",
    },
    sections: [
      {
        kind: "concept",
        id: "vc2m3sp02-concept",
        heading: "Using Alpha-Numeric Coordinates and Compass Directions",
        explanation:
          "A grid map divides an area into rows and columns to pinpoint exact locations:\n\n• **Alpha-Numeric Coordinates:** Columns along the bottom are labelled with letters (A, B, C, D...), and rows along the side are labelled with numbers (1, 2, 3, 4...).\n• **The Golden Reading Rule:** Always read the **horizontal letter first**, followed by the **vertical number** (think: 'Along the corridor (Letter), then Up the stairs (Number)'). For example, grid square **D4** means Column D, Row 4.\n\n**Compass Navigation (N, E, S, W):**\n• **North (N):** Facing towards the top of the map.\n• **South (S):** Facing towards the bottom of the map.\n• **East (E):** Facing towards the right of the map.\n• **West (W):** Facing towards the left of the map.\n(Memory helper: **N**ever **E**at **S**oggy **W**eet-Bix = clockwise N → E → S → W).",
        keyTerms: [
          {
            term: "Alpha-Numeric Grid",
            definition: "A coordinate system that combines letters along the horizontal axis with numbers along the vertical axis (e.g. B2).",
          },
          {
            term: "Cardinal Directions",
            definition: "The four main compass directions: North (N), East (E), South (S), and West (W).",
          },
          {
            term: "Pathway",
            definition: "A sequence of directional steps and distances describing how to move from a start point to a destination.",
          },
        ],
        visualAsset: {
          id: "vc2m3sp02-grid-map-table",
          type: "table",
          altText:
            "Grid map of a school playground showing features at different coordinate cells.",
          title: "School Playground Alpha-Numeric Grid Map",
          data: {
            headers: ["Row", "Column A", "Column B", "Column C", "Column D"],
            rows: [
              ["Row 4 (North)", "Oval (A4)", "Basketball Court (B4)", "Staff Carpark (C4)", "School Hall (D4)"],
              ["Row 3", "Sandpit (A3)", "Climbing Wall (B3)", "Playground Equipment (C3)", "Library (D3)"],
              ["Row 2", "Shade Sails (A2)", "Canteen (B2)", "Year 3 Classrooms (C2)", "Office (D2)"],
              ["Row 1 (South)", "Main Gate (A1)", "Bike Sheds (B1)", "Veggie Garden (C1)", "Art Room (D1)"],
            ],
            rowHeaders: true,
          },
        },
      },
      {
        kind: "worked_example",
        id: "vc2m3sp02-example",
        heading: "Worked Example: Navigating Across a School Grid Map",
        problem:
          "Using the School Playground Grid Map: (a) State the coordinate location of the Climbing Wall. (b) Describe a step-by-step pathway from the Main Gate (A1) to the Year 3 Classrooms (C2) using compass directions and grid grid steps.",
        steps: [
          {
            stepNumber: 1,
            label: "Locate the Climbing Wall coordinates",
            working:
              "Find 'Climbing Wall' on the map. Trace down to the bottom axis: it is in Column B. Trace left to the side axis: it is in Row 3. Coordinate: B3.",
            why: "Always read the horizontal column letter first (B), then the vertical row number (3).",
          },
          {
            stepNumber: 2,
            label: "Identify start point and destination coordinates",
            working:
              "Start position: Main Gate at A1. Destination: Year 3 Classrooms at C2.",
            why: "Defining the coordinates of both points makes calculating directional changes straightforward.",
          },
          {
            stepNumber: 3,
            label: "Calculate horizontal East-West movement",
            working:
              "From Column A to Column C, move 2 squares East (to the right): A1 → B1 → C1.",
            why: "Moving to the right across the columns is moving East.",
          },
          {
            stepNumber: 4,
            label: "Calculate vertical North-South movement",
            working:
              "From Row 1 to Row 2, move 1 square North (upward): C1 → C2.",
            why: "Moving upward along the rows is moving North.",
          },
        ],
        finalAnswer:
          "(a) The Climbing Wall is located at B3. (b) To travel from Main Gate (A1) to Year 3 Classrooms (C2): Walk 2 squares East, then walk 1 square North.",
        commonError: {
          mistake: "Writing coordinates with the number first (e.g. 3B instead of B3).",
          whyItHappens:
            "Forgetting whether the letter or number comes first.",
          howToAvoid:
            "Remember alphabetical order: Letters come before Numbers in the alphabet, so Letter comes first in coordinates (X then Y).",
        },
      },
      {
        kind: "misconception",
        id: "vc2m3sp02-misconception",
        heading: "Common Trap: Confusing East and West",
        claim: "East points to the left of a map and West points to the right.",
        whyWrong:
          "Looking at a standard map with North at the top, West is to the left and East is to the right. Together they spell the word 'WE' across the page.",
        correction:
          "Look across from left to right: W (West) on the left, E (East) on the right. They spell W-E.",
        example: "Australia's eastern coast (Sydney, Melbourne, Brisbane) is on the right side of the map.",
      },
      {
        kind: "check",
        id: "vc2m3sp02-check",
        heading: "Check Your Understanding",
        prompt:
          "Practise reading alpha-numeric grid coordinates and giving compass directions to navigate map routes.",
        curriculumCode: "VC2M3SP02",
        practiceCount: 5,
      },
    ],
  },
]);
