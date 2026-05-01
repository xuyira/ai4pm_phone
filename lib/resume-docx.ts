import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun
} from "docx";
import type { ResumeStructuredDocument } from "@/components/prototype-store";

const FONT_FAMILY = "Arial";

function createMetricRuns(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).flatMap((part) => {
    if (!part) {
      return [];
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return [
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: FONT_FAMILY,
          size: 20
        })
      ];
    }

    return [
      new TextRun({
        text: part,
        font: FONT_FAMILY,
        size: 20
      })
    ];
  });
}

function heading(text: string, level = HeadingLevel.HEADING_2) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 220, after: 100 },
    border: {
      bottom: {
        color: "D5C2A0",
        style: BorderStyle.SINGLE,
        size: 2
      }
    }
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: createMetricRuns(text),
    bullet: { level: 0 },
    spacing: { after: 80 }
  });
}

function sectionHeader(item: ResumeStructuredDocument["experience"][number]) {
  const [leftMeta, rightMeta] = item.subtitle?.split(" | ") ?? [];

  return new Paragraph({
    children: [
      new TextRun({
        text: item.title,
        bold: true,
        font: FONT_FAMILY,
        size: 24
      }),
      ...(leftMeta
        ? [
            new TextRun({
              text: `\n${leftMeta}`,
              color: "666666",
              font: FONT_FAMILY,
              size: 20
            })
          ]
        : []),
      ...(rightMeta
        ? [
            new TextRun({
              text: `\t${rightMeta}`,
              color: "666666",
              font: FONT_FAMILY,
              size: 20
            })
          ]
        : [])
    ],
    spacing: { before: 120, after: 60 },
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TabStopPosition.MAX
      }
    ]
  });
}

function sectionBlocks(items: ResumeStructuredDocument["experience"]) {
  return items.flatMap((item) => [sectionHeader(item), ...item.bullets.map((line) => bullet(line))]);
}

export async function buildResumeDocxBuffer(data: ResumeStructuredDocument) {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 20
          },
          paragraph: {
            spacing: {
              line: 276
            }
          }
        }
      }
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: data.candidateName,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
          }),
          new Paragraph({
            text: data.headline,
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 }
          }),
          new Paragraph({
            text: data.contactLines.join(" | "),
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 }
          }),
          heading("PROFESSIONAL SUMMARY"),
          ...data.summary.map(
            (line) =>
              new Paragraph({
                text: line,
                spacing: { after: 80 }
              })
          ),
          heading("EXPERIENCE"),
          ...sectionBlocks(data.experience),
          ...(data.projects.length > 0 ? [heading("PROJECTS"), ...sectionBlocks(data.projects)] : []),
          heading("EDUCATION"),
          ...sectionBlocks(data.education),
          ...(data.skills.length > 0
            ? [
                heading("SKILLS"),
                new Paragraph({
                  children: createMetricRuns(data.skills.join(" / ")),
                  spacing: { after: 80 }
                })
              ]
            : []),
          ...data.additionalSections.flatMap((section) => [
            heading(section.title.toUpperCase()),
            ...(section.subtitle
              ? [
                  new Paragraph({
                    text: section.subtitle,
                    spacing: { after: 80 }
                  })
                ]
              : []),
            ...section.bullets.map((line) => bullet(line))
          ])
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}
