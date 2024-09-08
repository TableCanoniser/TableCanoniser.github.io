const option: TableCanoniserTemplate[] = [
  {
    match: {
      startCell: {
        offsetX: 0,
        offsetY: 0,
      },
      size: {
        width: 12, //"toParentX",
        height: null,
      },
      constraints: [
        {
          offsetX: 5,
          offsetY: 0,
          valueCstr: "Employee Previous Earnings",
        },
        {
          offsetFrom: "bottomLeft",
          offsetX: 0,
          offsetY: 1,
          valueCstr: "ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)",
        },
      ],
      traverse: {
        yDirection: "after",
      },
    },
    fill: TableCanoniserKeyWords.Forward,
    children: [
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 4,
          },
          size: {
            width: 2,
          },
        },
        extract: {
          byPositionToTargetCols: ["EmployeeID", "Employee Name"],
        },
      },
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 8,
          },
          size: {
            width: 12,
            height: null,
          },
          traverse: {
            yDirection: "after",
          },
          constraints: [
            {
              offsetFrom: "bottomLeft",
              valueCstr: TableCanoniserKeyWords.None,
            },
            {
              offsetFrom: "bottomRight",
              offsetY: 1,
              valueCstr: TableCanoniserKeyWords.None,
            },
          ],
        },
        fill: "",
        children: [
          {
            match: {
              startCell: {
                offsetX: 0,
                offsetY: 0,
              },
              size: {
                width: 1,
                height: 1,
              },
              traverse: {},
            },
            extract: {
              byPositionToTargetCols: ["Period End Date"],
            },
          },
          {
            match: {
              startCell: {
                offsetX: 10,
                offsetY: 1,
              },
              size: {
                width: 2,
                height: 1,
              },
              traverse: {
                xDirection: "after",
                yDirection: "after",
              },
              constraints: [
                {
                  offsetX: -5,
                  offsetY: 0,
                  valueCstr: "Normal Hours",
                },
              ],
            },
            extract: {
              byPositionToTargetCols: ["Normal Hours", "Amount"],
            },
          },
        ],
      },
    ],
  },
];

const option2: TableCanoniserTemplate[] = [
  {
    match: {
      startCell: {
        offsetX: 0,
        offsetY: 0,
      },
      size: {
        width: "toParentX",
        height: null,
      },
      constraints: [
        {
          offsetX: 5,
          offsetY: 0,
          valueCstr: "Employee Previous Earnings",
        },
        {
          offsetFrom: "bottomLeft",
          offsetX: 0,
          offsetY: 1,
          valueCstr: (value) => {
            if (typeof value === "string")
              return value.startsWith("ACME Payroll");
            return false;
          },
        },
      ],
      traverse: {
        yDirection: "after",
      },
    },
    fill: "",
    children: [
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 4,
          },
          size: {
            width: 2,
          },
        },
        extract: {
          byPositionToTargetCols: ["EmployeeID", "Employee Name"],
        },
      },
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 8,
          },
          size: {
            width: 12,
            height: null,
          },
          traverse: {
            yDirection: "after",
          },
          constraints: [
            {
              offsetFrom: "bottomLeft",
              valueCstr: TableCanoniserKeyWords.None,
            },
            {
              offsetFrom: "bottomRight",
              offsetY: 1,
              valueCstr: TableCanoniserKeyWords.None,
            },
          ],
        },
        children: [
          {
            match: {
              startCell: {
                offsetX: 0,
                offsetY: 0,
              },
              size: {
                width: 5,
                height: 1,
              },
              traverse: {},
            },
            extract: {
              byPositionToTargetCols: [
                "Period End Date",
                "Pay Frequency",
                null,
                "Location",
                "Number",
              ],
            },
          },
          {
            match: {
              startCell: {
                offsetX: 10,
                offsetY: 1,
              },
              size: {
                width: 2,
                height: 1,
              },
              traverse: {
                xDirection: "after",
                yDirection: "after",
              },
              constraints: [
                {
                  offsetX: -5,
                  offsetY: 0,
                  valueCstr: "Normal Hours",
                },
              ],
            },
            extract: {
              byPositionToTargetCols: ["Hours", "Amount"],
            },
          },
        ],
      },
    ],
  },
];

const option3: TableCanoniserTemplate[] = [
  {
    match: {
      startCell: {
        offsetX: 0,
        offsetY: 0,
      },
      size: {
        width: "toParentX", // 12,
        height: null,
      },
      constraints: [
        {
          offsetX: 5,
          offsetY: 0,
          valueCstr: "Employee Previous Earnings",
        },
        {
          offsetFrom: "bottomLeft",
          offsetX: 0,
          offsetY: 1,
          valueCstr: (value) => {
            if (typeof value === "string")
              return value.startsWith("ACME Payroll");
            return false;
          },
        },
      ],
      traverse: {
        yDirection: "after",
      },
    },
    fill: "", // TableCanoniserKeyWords.Forward,
    children: [
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 4,
          },
          size: {
            width: 2,
          },
        },
        extract: {
          byPositionToTargetCols: ["EmployeeID", "Employee Name"],
        },
      },
      {
        match: {
          startCell: {
            offsetX: 0,
            offsetY: 8,
          },
          size: {
            width: "toParentX",
          },
          traverse: {
            yDirection: "after",
          },
        },
        extract: {
          byContext: {
            position: (cell) => {
              let offsetX = cell.offsetX,
                offsetY = 7;
              if (cell.offsetX == 4) offsetY = 6;
              return [
                {
                  offsetX,
                  offsetY,
                  offsetLayer: "parent",
                },
              ];
            },
          },
        },
      },
    ],
  },
];
