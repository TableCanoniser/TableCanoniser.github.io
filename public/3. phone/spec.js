const option: TableCanoniserTemplate[] = [
  {
    match: {
      startCell: {
        offsetX: 0,
        offsetY: 0,
      },
      size: {
        width: 7,
        height: null, // 6
      },
      constraints: [
        {
          offsetX: 1,
          offsetY: 0,
          valueCstr: (value) => {
            if (typeof value === "string") return value.startsWith("$");
            return false;
          },
        },
        {
          offsetFrom: "bottomLeft",
          offsetX: 0,
          offsetY: 1,
          valueCstr: TableCanoniserKeyWords.None,
        },
      ],
      traverse: {
        yDirection: "after",
      },
    },
    children: [
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 0,
          },
          size: {
            width: 2,
            height: 1,
          },
        },
        extract: {
          byPositionToTargetCols: ["Phone", "Price"],
        },
      },
      {
        match: {
          startCell: {
            offsetX: 1,
            offsetY: 1,
          },
          constraints: [
            {
              offsetX: -1,
              offsetY: 0,
              valueCstr: TableCanoniserKeyWords.String,
            },
            {
              offsetX: 1,
              offsetY: 0,
              valueCstr: TableCanoniserKeyWords.None,
            },
          ],
          traverse: {
            yDirection: "after",
          },
        },
        extract: {
          byContext: {
            position: "left",
            toTargetCol: (ctxCells) => {
              if (ctxCells[0].value === "Announced Date") return "Release Date";
              return ctxCells[0].value;
            },
          },
        },
      },
      {
        match: {
          startCell: {
            offsetX: 1,
            offsetY: 2,
          },
          size: {
            width: 6,
            height: 1,
          },
          constraints: [
            {
              offsetX: -1,
              offsetY: 0,
              valueCstr: "Dimensions",
            },
          ],
          traverse: {
            yDirection: "beforeAndAfter",
          },
        },
        children: [
          {
            match: {
              startCell: {
                offsetX: 1,
                offsetY: 0,
              },
              constraints: [
                {
                  offsetX: 0,
                  offsetY: 0,
                  valueCstr: (value) => {
                    if (typeof value === "string") return value.endsWith("mm");
                    return false;
                  },
                },
              ],
              traverse: {
                xDirection: "after",
              },
            },
            extract: {
              byContext: {
                position: "left",
                toTargetCol: (ctxCells) => {
                  const contextValue = ctxCells[0].value;
                  if (typeof contextValue != "string") return null;
                  if (["Height", "H"].includes(contextValue)) return "Height";
                  if (["Width", "W"].includes(contextValue)) return "Width";
                  if (["Depth", "D"].includes(contextValue)) return "Depth";
                  return null;
                },
              },
            },
          },
        ],
      },
      {
        match: {
          startCell: {
            offsetX: 1,
            offsetY: 4,
          },
          size: {
            width: 2,
            height: 1,
          },
          constraints: [
            {
              offsetX: -1,
              offsetY: 0,
              valueCstr: "Camera",
            },
          ],
          traverse: {
            yDirection: "beforeAndAfter",
          },
        },
        extract: {
          byValue: (currentAreaTbl) => {
            // console.log(currentAreaTbl[0].map(Number));
            return TableCanoniserKeyWords.pairSort(
              currentAreaTbl[0].map(Number),
              ["Front Camera", "Rear Camera"],
              "asc"
            );
          },
        },
      },
    ],
  },
];
