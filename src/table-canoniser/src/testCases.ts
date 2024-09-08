import { Table2D, TableCanoniserTemplate, TableCanoniserKeyWords } from "./grammar";
import { transformTable } from "./index";


const example1_mt: Table2D = [
    ["Rank", "Name", "Age"],
    [1, "Bob", 16],
    ["", "Score", 92],
    [2, "Sam", 15],
    ["", "Score", 89],
    [3, "Alice", 16],
    ["", "Score", 87],
    [4, "John", 16],
    ["", "Score", 86],
];

const example1_spec: TableCanoniserTemplate = {
    match: {
        startCell: { offsetX: 0, offsetY: 1 },
        size: { width: 'toParentX', height: 2 },
        constraints: [{ offsetX: 0, offsetY: 0, valueCstr: TableCanoniserKeyWords.Number }],
        traverse: { yDirection: 'after' },
    },
    children: [
        {
            match: {
                startCell: { offsetX: 0, offsetY: 0 },
                size: { width: 'toParentX' },
            },
            extract: { byPositionToTargetCols: ["Rank", "Name", "Age"] }
        },
        {
            match: {
                startCell: { offsetX: 2, offsetY: 1 },
                constraints: [{ offsetX: -1, offsetY: 0, valueCstr: 'Score' }],
            },
            extract: { byPositionToTargetCols: ["Score"] }
        }
    ]
};

const case1_mt: Table2D = [
    ["Rank", "Name", "Location", "Total Score"],
    ["1", "Tsinghua", "Beijing", "992.6"],
    ["", "Level", "Resources", "Education"],
    ["", "36.1", "50.0", "324.2"],
    ["", "Research", "Elite", "Global"],
    ["", "104.9", "88.4", "92.1"],
    ["2", "Peking", "Beijing", "898.6"],
    ["", "Resources", "Level", "Education"],
    ["", "34.9", "30.5", "308.3"],
    ["", "Research", "Elite", "Global"],
    ["", "101.8", "92.4", "71.4"],
    ["3", "Zhejiang", "Zhejiang", "793.8"],
    ["", "Level", "Resources", "Education"],
    ["", "34.9", "28.4", "284.7"],
    ["", "Research", "", "Global"],
    ["", "92.6", "", "53.7"],
    [
        "",
        "Notation",
        "The above are the top three universities in the rankings",
        ""
    ],
    ["4", "Shangjiao", "Shanghai", "776.3"],
    ["", "Level", "Resources", "Education"],
    ["", "35.6", "26.4", "267.2"],
    ["", "Research", "Elite", "Global"],
    ["", "106.5", "64.6", "39.6"],
    ["5", "Fudan", "Shanghai", "697.0"],
    ["", "Level", "Resources", "Education"],
    ["", "36.6", "21.3", "252.6"],
    ["", "Research", "Elite", "Global"],
    ["", "79.3", "62.6", "44.1"],
    ["6", "Nanjing", "Jiangsu", "656.1"],
    ["", "Level", "Education", "Resources"],
    ["", "37.1", "266.6", "9.2"],
    ["", "Research", "Elite", "Global"],
    ["", "70.4", "58.3", "29.2"]
];


const case1_spec: TableCanoniserTemplate = {
    match: {
        startCell: {
            offsetX: 0,
            offsetY: 1,
        },
        size: {
            width: "toParentX",
            height: 5,
        },
        constraints: [
            {
                offsetX: 0,
                offsetY: 0,
                valueCstr: TableCanoniserKeyWords.Number,
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
                    width: 4,
                    height: 1,
                },
            },
            extract: {
                byPositionToTargetCols: ["Rank", "Name", "Location", "Total Score"],
            },
        },
        {
            match: {
                startCell: {
                    offsetX: 1,
                    offsetY: 2,
                },
                constraints: [
                    {
                        offsetX: 0,
                        offsetY: 0,
                        valueCstr: TableCanoniserKeyWords.Number,
                    },
                    {
                        offsetX: 0,
                        offsetY: -1,
                        valueCstr: TableCanoniserKeyWords.String,
                    },
                ],
                traverse: {
                    xDirection: "after",
                    yDirection: "after",
                }
            },
            extract: {
                byContext: {
                    position: "above",
                }
            },
            fill: "",
        },
    ],
};


const case2_mt: Table2D = [
    ["Unsupervised DA", "", "SOTA (image-based)", ""],
    ["baseline", "93.78", "DeepFace", "91.4"],
    ["PCA", "93.56", "FaceNet", "95.12"],
    ["CORAL", "94.5", "CenterFace", "94.9"],
    ["Ours (F)", "95.38", "CNN+AvePool", "95.2"]
];

const case2_spec: TableCanoniserTemplate = {
    match: {
        startCell: {
            offsetX: 0,
            offsetY: 1,
        },
        size: {
            width: 2,
            height: 1,
        },
        traverse: {
            xDirection: "after",
            yDirection: "after",
        }
    },
    extract: {
        byPositionToTargetCols: ["Method", "Accuracy"],
    },
    children: [
        {
            match: {
                startCell: {
                    offsetLayer: "root",
                    offsetX: (currentArea) => currentArea.x, // currentArea.xIndex * 2,
                    offsetY: 0,
                }
            },
            extract: {
                byPositionToTargetCols: ["Category"],
            },
        },
    ],
};

const case2_2_spec: TableCanoniserTemplate = {
    match: {
        startCell: {
            offsetX: 0,
            offsetY: 0,
        },
        size: {
            width: 2,
            height: "toParentY", // 5,
        },
        traverse: {
            xDirection: "after",
        }
    },
    children: [
        {
            match: {
                startCell: {
                    offsetX: 0,
                    offsetY: 1,
                },
                size: {
                    width: 2,
                    height: 1,
                },
                traverse: {
                    yDirection: "after",
                }
            },
            extract: {
                byPositionToTargetCols: ["Method", "Accuracy"],
            },
        },
        {
            match: {
                startCell: {
                    offsetX: 0,
                    offsetY: 0,
                }
            },
            extract: {
                byPositionToTargetCols: ["Category"],
            },
        },
    ],
    // fill: TableCanoniserKeyWords.Forward
};

const case2_3_spec: TableCanoniserTemplate = {
    match: {
        startCell: {
            offsetX: 0,
            offsetY: 0,
        },
        size: {
            width: 2,
            height: "toParentY",
        },
        traverse: {
            xDirection: "after",
        },
        constraints: [
            {
                offsetFrom: "topRight",
                valueCstr: TableCanoniserKeyWords.None
            }
        ]
    },
    children: [
        {
            match: {
                startCell: {
                    offsetX: 0,
                    offsetY: 1,
                },
                size: {
                    width: 2,
                    height: 1,
                },
                traverse: {
                    yDirection: "after",
                }
            },
            extract: {
                byPositionToTargetCols: ["Method", "Accuracy"],
            },
        },
        {
            match: {
                startCell: {
                    offsetX: 0,
                    offsetY: 0,
                }
            },
            extract: {
                byPositionToTargetCols: ["Category"],
            },
        },
    ],
    // fill: TableCanoniserKeyWords.Forward
};


const case3_mt: Table2D = [
    ["OnePlus 2", "$330", "", "", "", "", ""],
    ["Release Date", "Aug 2015", "", "", "", "", ""],
    [
        "Dimensions",
        "Height",
        "151.8 mm",
        "Width",
        "74.9 mm",
        "Depth",
        "9.85 mm"
    ],
    ["Weight", "175 g", "", "", "", "", ""],
    ["Camera", "5", "13", "", "", "", ""],
    ["Battery", "3300 mAh LiPO", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["test_phone", "$379", "", "", "", "", ""],
    ["Release Date", "Nov 2015", "", "", "", "", ""],
    ["Dimensions", "Height", "72.6 mm", "Width", "72.6 mm", "Depth", "7.9 mm"],
    ["Weight", "136 g", "", "", "", "", ""],
    ["Camera", "6", "6", "", "", "", ""],
    ["Battery", "2700 mAh LiPO", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Motorola X PURE", "$400", "", "", "", "", ""],
    ["Release Date", "Sept 2015", "", "", "", "", ""],
    [
        "Dimensions",
        "Width",
        "76.2 mm",
        "Height",
        "153.9 mm",
        "Depth",
        "6.1 to 11.06 mm"
    ],
    ["Weight", "179 g", "", "", "", "", ""],
    ["Camera", "5", "21", "", "", "", ""],
    ["Battery", "3000 mAh", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Samsung Galaxy S6", "$580", "", "", "", "", ""],
    ["Announced Date", "2015 Apr", "", "", "", "", ""],
    ["Dimensions", "H", "143.4 mm", "W", "70.5 mm", "D", "6.8 mm"],
    ["Weight", "138 g", "", "", "", "", ""],
    ["Camera", "16", "5", "", "", "", ""],
    ["Battery", "2550 mAh", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Samsung Galaxy Note 5", "$720", "", "", "", "", ""],
    ["Announced Date", "2015 Aug", "", "", "", "", ""],
    ["Dimensions", "W", "76.1 mm", "H", "153.2 mm", "D", "7.6 mm"],
    ["Weight", "171 g", "", "", "", "", ""],
    ["Camera", "16", "5", "", "", "", ""],
    ["Battery", "3000 mAh LiPO", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Apple iPhone 6s", "$650", "", "", "", "", ""],
    ["Release Date", "Sept 2015", "", "", "", "", ""],
    ["Dimensions", "Height", "138.3 mm", "Width", "67.1 mm", "Depth", "7.1 mm"],
    ["Weight", "143 g", "", "", "", "", ""],
    ["Camera", "5", "12", "", "", "", ""],
    ["Battery", "1715 mAh LiPO", "", "", "", "", ""],
    ["", "", "", "", "", "", ""]
];

const case3_spec: TableCanoniserTemplate = {
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
        }
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
                }
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
                }
            },
            extract: {
                byContext: {
                    position: "left",
                    toTargetCol: (ctxCells) => {
                        if (ctxCells[0].value === "Announced Date") return "Release Date";
                        return ctxCells[0].value;
                    },
                }
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
                    yDirection: 'beforeAndAfter',
                }
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
                        }
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
                }
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
                    yDirection: 'beforeAndAfter',
                }
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
};


const case4_mt: Table2D = [
    ["Summary Statement of Account Limits for Accounts under Domestic Fund Pool of a Bank", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", ""], ["Region Code:", "1111", "", "Branch Code:", "1001", "", "2020/1/1", "", "Currency:", "CNY", "", "Page 1"], ["Account No.:", "12345", "", "Account Name:", "Main Bank A", "", "", "", "", "", "Agreement No.:", "123123123"], ["", "", "", "", "", "", "", "", "", "", "", ""], ["Index", "Sub Account Name", "", "Yesterday Available Credit", "Yesterday Reserved Credit", "Yesterday Frozen Credit", "", "Total Debit Transactions", "Total Debit Amount", "", "", "Today Net Deposit Amount "], ["", "Sub Account No.", "", "Today Available Credit", "Today Reserved Credit", "Today Frozen Credit", "", "Total Credit Transactions", "Total Credit Amount", "", "", ""], ["1", "Sub Bank A1", "", "11256568.73", "4614836.37", "1587748.25", "", "1", "11058.38", "", "", "-11400.11"], ["", "12345010", "", "11245168.62", "2083401.72", "1587748.25", "", "5", "16709.52", "", "", ""], ["2", "Sub Bank A2", "", "4156308.41", "1388858.84", "0.00", "", "7", "24550.18", "", "", "17017.61"], ["", "12345020", "", "4173326.02", "1733145.67", "0.00", "", "6", "83387.82", "", "", ""], ["3", "Sub Bank A3", "", "66786044.88", "22381748.78", "9105304.25", "", "9", "67781.17", "", "", "-19552.31"], ["", "12345030", "", "66766492.57", "12051751.66", "9105304.25", "", "2", "10130.22", "", "", ""], ["4", "Sub Bank A4", "", "53753568.53", "24154683.97", "0.00", "", "6", "9207.08", "", "", "5284.60"], ["", "12345040", "", "53758853.13", "12512925.66", "0.00", "", "9", "27100.26", "", "", ""], ["5", "Sub Bank A5", "", "68054078.36", "21768029.70", "3937029.54", "", "4", "15792.7", "", "", "19246.19"], ["", "12345050", "", "68073324.55", "9459141.76", "3937029.54", "", "7", "45228.12", "", "", ""], ["6", "Sub Bank A6", "", "12589233.46", "3071902.44", "1447270.10", "", "2", "34432.36", "", "", "15627.18"], ["", "12345060", "", "12604860.64", "882029.83", "1447270.10", "", "2", "39454.18", "", "", ""], ["7", "Sub Bank A7", "", "15699238.47", "3689156.95", "1572270.22", "", "2", "8848.5", "", "", "-6939.28"], ["", "12345070", "", "15692299.19", "3457640.37", "1572270.22", "", "4", "55521.79", "", "", ""], ["8", "Sub Bank A8", "", "97827738.78", "40848842.95", "19829919.22", "", "7", "51401.15", "", "", "-17842.02"], ["", "12345080", "", "97809896.76", "421674.67", "19829919.22", "", "2", "98199.66", "", "", ""], ["9", "Sub Bank A9", "", "92749039.79", "9057918.32", "1782096.47", "", "4", "15995.18", "", "", "15388.64"], ["", "12345090", "", "92764428.43", "1009390.27", "1782096.47", "", "1", "5830.36", "", "", ""], ["10", "Sub Bank A10", "", "3165008.51", "286684.96", "0.00", "", "3", "72287.61", "", "", "9015.26"], ["", "12345100", "", "3174023.77", "1320813.17", "0.00", "", "10", "78882.47", "", "", ""], ["11", "Sub Bank A11", "", "94721227.01", "29847920.32", "495266.31", "", "1", "13719.45", "", "", "-17915.14"], ["", "12345110", "", "94703311.87", "31011921.74", "495266.31", "", "6", "94272.49", "", "", ""], ["12", "Sub Bank A12", "", "97581908.19", "15111439.55", "2402008.31", "", "0", "0", "", "", "29145.58"], ["", "12345120", "", "97611053.77", "45627269.52", "2402008.31", "", "10", "46775.75", "", "", ""], ["13", "Sub Bank A13", "", "12097174.28", "5609928.54", "0.00", "", "5", "59365.26", "", "", "20022.57"], ["", "12345130", "", "12117196.85", "5461315.46", "0.00", "", "6", "92736.58", "", "", ""], ["14", "Sub Bank A14", "", "89024714.22", "24758438.14", "0.00", "", "5", "7436.89", "", "", "-18833.12"], ["", "12345140", "", "89005881.10", "33920372.96", "0.00", "", "0", "0", "", "", ""], ["15", "Sub Bank A15", "", "35241886.59", "10377709.67", "0.00", "", "1", "19949.3", "", "", "21893.60"], ["", "12345150", "", "35263780.19", "16744888.27", "0.00", "", "7", "54955.41", "", "", ""], ["16", "Sub Bank A16", "", "69266884.12", "18936027.08", "7837789.15", "", "2", "98991.61", "", "", "11498.08"], ["", "12345160", "", "69278382.20", "23605272.31", "7837789.15", "", "7", "38387.66", "", "", ""], ["17", "Sub Bank A17", "", "63252931.99", "3260536.65", "1055186.11", "", "6", "99018.42", "", "", "11349.67"], ["", "12345170", "", "63264281.66", "1922734.69", "1055186.11", "", "5", "93034.37", "", "", ""], ["18", "Sub Bank A18", "", "41686735.78", "1090116.39", "367085.19", "", "1", "9912.01", "", "", "-14795.57"], ["", "12345180", "", "41671940.21", "5829080.80", "367085.19", "", "10", "45861.97", "", "", ""], ["19", "Sub Bank A19", "", "23741324.70", "2892677.42", "0.00", "", "8", "95684.36", "", "", "28125.03"], ["", "12345190", "", "23769449.73", "7334552.06", "0.00", "", "1", "26060.15", "", "", ""], ["20", "Sub Bank A20", "", "50233431.33", "8698213.14", "0.00", "", "5", "74997.7", "", "", "-12924.44"], ["", "12345200", "", "50220506.89", "20226283.20", "0.00", "", "1", "82798.5", "", "", ""], ["21", "Sub Bank A21", "", "28998385.46", "5775628.37", "0.00", "", "4", "97855.79", "", "", "-892.15"], ["", "12345210", "", "28997493.31", "10593570.71", "0.00", "", "6", "28035.3", "", "", ""], ["22", "Sub Bank A22", "", "74552167.23", "33123924.04", "11877888.44", "", "5", "67233.8", "", "", "-9626.99"], ["", "12345220", "", "74542540.24", "35613649.00", "11877888.44", "", "7", "98453.99", "", "", ""], ["23", "Sub Bank A23", "", "42651485.90", "8020241.50", "0.00", "", "1", "78082.84", "", "", "-18982.03"], ["", "12345230", "", "42632503.87", "8118887.14", "0.00", "", "5", "12838.64", "", "", ""], ["24", "Sub Bank A24", "", "29535659.30", "5807832.34", "0.00", "", "5", "13844.41", "", "", "-1555.50"], ["", "12345240", "", "29534103.80", "789704.47", "0.00", "", "8", "41572.65", "", "", ""], ["25", "Sub Bank A25", "", "54928082.40", "10031474.66", "4014370.35", "", "0", "0", "", "", "23605.14"], ["", "12345250", "", "54951687.54", "19040555.27", "4014370.35", "", "9", "26805.76", "", "", ""]
];

const case4_spec: TableCanoniserTemplate = {
    match: {
        startCell: {
            offsetX: 0,
            offsetY: 7,
        },
        size: {
            width: "toParentX", // 12,
            height: 2,
        },
        traverse: {
            yDirection: "after",
        }
    },
    extract: {
        byContext: {
            position: (cell, currentArea) => {
                return [{
                    offsetX: cell.offsetX,
                    offsetY: cell.offsetY - (currentArea.yIndex + 1) * currentArea.height,
                }];
            },
        },
    },
};

const case4_spec2: TableCanoniserTemplate = {
    match: {
        startCell: {
            offsetX: 0,
            offsetY: 7,
        },
        size: {
            width: "toParentX", // 12,
            height: 2,
        },
        traverse: {
            yDirection: "after",
        }
    },
    extract: {
        byPositionToTargetCols: ["Index", "Sub Account Name", "", "Yesterday Available Credit", "Yesterday Reserved Credit", "Yesterday Frozen Credit", "", "Total Debit Transactions", "Total Debit Amount", "", "", "Today Net Deposit Amount ", "", "Sub Account No.", "", "Today Available Credit", "Today Reserved Credit", "Today Frozen Credit", "", "Total Credit Transactions", "Total Credit Amount", "", "", ""]
    },
};


const case5_mt: Table2D = [
    ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 1 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["001SMITH", "John Smith", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["6/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "23", "351.87"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "351.87"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "351.87"], ["13/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "46", "703.74"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "703.74"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-80"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "623.74"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "66.86"], ["20/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "37.5", "573.7"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "573.7"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-53"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "520.7"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "54.5"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 5 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["002JOHNS", "Jane Johnson", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["16/04/1985", "1W01 - Weekly", "", "CARCOSA", "2", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "46", "1003.22"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "1003.22"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-85"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "918.22"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "95.3"], ["23/04/1985", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "19.5", "425.27"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "425.27"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-14"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "411.27"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "40.4"], ["30/04/1985", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "30", "654.27"], ["", "", "", "", "", "Sat Casual Ldg", "", "", "", "", "8.5", "14.83"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "669.1"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-73"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "596.1"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "63.56"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 6 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["003WILLI", "Mark Williams", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "40", "792.31"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "792.31"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-110"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "682.31"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "75.27"], ["12/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "40", "792.31"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "792.31"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-110"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "682.31"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "75.27"], ["19/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "40", "792.31"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "792.31"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-110"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "682.31"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "75.27"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 14 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["004BROWN", "Mary Brown", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "28.5", "567.73"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7.5", "89.64"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "657.37"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-71"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "586.37"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "62.45"], ["12/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "29", "591.55"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7.5", "91.79"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "683.34"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-76"], ["", "", "", "", "", "Reimburse expenses", "", "", "", "", "0", "50"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "657.34"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "64.92"], ["19/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "21", "428.36"], ["", "", "", "", "", "Sick Leave", "", "", "", "", "7.5", "152.99"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "581.35"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-55"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "526.35"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "55.23"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 39 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["005JONES", "Paul Jones", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["8/11/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "16", "407.97"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "407.97"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-10"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "397.97"], ["15/11/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "8", "203.98"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "203.98"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "203.98"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "58.14"], ["22/11/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "8.5", "216.73"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "216.73"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "216.73"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "20.59"], ["10/01/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "0"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "0"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 40 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["006GARCI", "Lucy Garcia", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "38", "771.42"], ["", "", "", "", "", "Long Service Leave", "", "", "", "", "76", "1542.84"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "2314.26"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-623"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "1691.26"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "219.85"], ["12/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "18", "374.18"], ["", "", "", "", "", "Annual Leave", "", "", "", "", "20", "415.75"], ["", "", "", "", "", "Leave Loading 17.5%", "", "", "", "", "0", "72.76"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "862.69"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-135"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "727.69"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "75.04"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 44 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["007MILLE", "Ryan Miller", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/12/1983", "1W01 - Weekly", "", "CARCOSA", "2", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "58", "1222.14"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7.5", "94.82"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "1316.96"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-142"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "1174.96"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "125.11"], ["12/12/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "43", "906.07"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "906.07"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-150"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "756.07"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "86.08"], ["19/12/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "40.5", "853.4"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "853.4"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-131"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "722.4"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "81.07"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 52 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["008DAVIS", "Emma Davis", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "16", "318.72"], ["", "", "", "", "", "Annual Leave", "", "", "", "", "7.5", "149.4"], ["", "", "", "", "", "Leave Loading 17.5%", "", "", "", "", "0", "26.15"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "494.27"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-36"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "458.27"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "44.47"], ["12/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "20.5", "418.17"], ["", "", "", "", "", "Annual Leave", "", "", "", "", "7.5", "152.99"], ["", "", "", "", "", "Leave Loading 17.5%", "", "", "", "", "0", "26.77"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "597.93"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-58"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "539.93"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "54.26"], ["19/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "35", "713.94"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "713.94"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-83"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "630.94"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "67.82"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 57 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["009RODRI", "Jack Rodriguez", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["22/08/1983", "1W01 - Weekly", "", "CARCOSA", "2", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "17", "268.66"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "268.66"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "268.66"], ["5/09/1983", "1W01 - Weekly", "", "CARCOSA", "2", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "17", "268.66"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "268.66"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "268.66"], ["12/09/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "7.5", "118.53"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "118.53"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "118.53"], ["19/09/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "16", "252.86"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "252.86"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "252.86"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 70 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["010MARTI", "Lily Martinez", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["29/11/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "8.5", "173.39"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "173.39"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "173.39"], ["6/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "8.5", "173.39"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "173.39"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "173.39"], ["13/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "25", "509.96"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "509.96"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-39"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "470.96"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "64.92"], ["20/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "32", "652.75"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7.5", "91.79"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "744.54"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-94"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "650.54"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "70.73"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 91 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["011HERN", "Mike Hernandez", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["23/08/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "32.75", "668.04"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "668.04"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-73"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "595.04"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "63.46"], ["30/08/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "33", "673.14"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "673.14"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-74"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "599.14"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "63.95"], ["6/09/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Sick Leave", "", "", "", "", "32", "652.75"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "652.75"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-70"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "582.75"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "62.01"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 111 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["012LOPEZ", "Kate Lopez", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["20/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "38.5", "441.75"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "441.75"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-20"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "421.75"], ["27/12/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "37.5", "430.28"], ["", "", "", "", "", "Public Holiday - worked", "", "", "", "", "7.5", "215.14"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "645.42"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-68"], ["", "", "", "", "", "Reimburse expenses", "", "", "", "", "0", "50"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "627.42"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "103.28"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 129 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["013GONZA", "Adam Gonzalez", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "30", "604.82"], ["", "", "", "", "", "Other Leave - Bereavement", "", "", "", "", "8", "161.28"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "766.1"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-101"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "665.1"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "57.46"], ["12/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "42", "867.06"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "867.06"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-136"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "731.06"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "82.37"], ["19/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "26", "536.75"], ["", "", "", "", "", "Annual Leave", "", "", "", "", "14", "289.02"], ["", "", "", "", "", "Leave Loading 17.5%", "", "", "", "", "0", "50.58"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "876.35"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-139"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "737.35"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "78.45"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 151 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["014WILSO", "Anne Wilson", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["26/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "15", "305.97"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "305.97"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "305.97"], ["2/08/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "30", "611.95"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "611.95"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-61"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "550.95"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "58.14"], ["9/08/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "37.5", "764.94"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "764.94"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-101"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "663.94"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "72.67"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 179 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["015ANDE", "Eric Anderson", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["14/02/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "7.5", "152.99"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "152.99"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "152.99"], ["21/02/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "37", "754.74"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7", "85.67"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "840.41"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-127"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "713.41"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "94.37"], ["28/02/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "31.25", "637.45"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "6.5", "79.55"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "717"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-84"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "633"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "68.12"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 194 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["016THOM", "Amy Thomas", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "14.5", "252.74"], ["", "", "", "", "", "Sun Cas Ldg", "", "", "", "", "7.5", "91.51"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "344.25"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "344.25"], ["12/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "14", "249.88"], ["", "", "", "", "", "Sun Cas Ldg", "", "", "", "", "7", "87.46"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "337.34"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-166"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "171.34"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "64.75"], ["19/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "22", "392.67"], ["", "", "", "", "", "Sun Cas Ldg", "", "", "", "", "7.5", "93.7"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "486.37"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-239"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "247.37"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "46.21"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 199 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["017TAYLO", "Ben Taylor", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["27/02/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "9.5", "200.18"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "200.18"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "200.18"], ["6/03/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "20.5", "431.96"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7.5", "94.82"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "526.78"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-43"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "483.78"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "50.04"], ["13/03/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "30", "632.14"], ["", "", "", "", "", "60% Sun Perm Ldg", "", "", "", "", "7.5", "94.82"], ["", "", "", "", "", "Public Holiday - worked", "", "", "", "", "4", "189.64"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "916.6"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-153"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "763.6"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "87.08"], ["20/03/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "21.5", "453.04"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "453.04"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-23"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "430.04"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "43.04"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 206 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["018MOORE", "Eva Moore", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["5/07/1982", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "20", "398.4"], ["", "", "", "", "", "Sick Leave", "", "", "", "", "6", "119.52"], ["", "", "", "", "", "Term AL Gross", "", "", "", "", "89.04", "1773.69"], ["", "", "", "", "", "Term LL Gross", "", "", "", "", "0", "310.4"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "2602.01"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "-665"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "1937.01"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "49.2"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 207 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["019JACKS", "Ian Jackson", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["15/05/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "4", "105.36"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "105.36"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "105.36"], ["22/05/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "4.5", "118.53"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "118.53"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "118.53"], ["5/06/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "8.5", "223.88"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "223.88"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Uniforms - Reducing Balance", "", "", "", "", "0", "-10"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "213.88"], ["12/06/1984", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "5.5", "144.87"], ["", "", "", "", "", "Sun Cas Ldg", "", "", "", "", "5.5", "101.41"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "246.28"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Uniforms - Reducing Balance", "", "", "", "", "0", "-10"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "236.28"], ["", "", "", "", "", "Superannuation", "", "", "", "", "0", "44.67"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""], ["", "", "", "", "", "Employee Previous Earnings", "", "", "", "", "", ""], ["", "", "", "", "", "AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", ""], ["Employee Previous Earnings", "", "", "", "", "", "", "", "", "", "", "Page 216 of 553"], ["Payroll Company", "", "AMALGAMATED WIDGETS - AMALGAMATED WIDGETS PTY LTD", "", "", "", "", "", "", "", "", ""], ["020MARTI", "Zoe Martin", "", "", "", "", "", "", "", "", "", ""], ["For Pay End Periods between 1/07/1982 and 25/06/1985", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Number of", "", "", "", "", "", "", ""], ["Period End Date", "Pay Frequency", "", "Location", "", "Description", "", "", "", "", "Hours", "Amount"], ["12/12/1983", "1W01 - Weekly", "", "CARCOSA", "2", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "33", "391.14"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "391.14"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "391.14"], ["19/12/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "18", "213.35"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "213.35"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "213.35"], ["26/12/1983", "1W01 - Weekly", "", "CARCOSA", "1", "", "", "", "", "", "", ""], ["", "", "", "", "", "Normal Hours", "", "", "", "", "15", "177.79"], ["", "", "", "", "", "Gross Taxable Total", "", "", "", "", "0", "177.79"], ["", "", "", "", "", "Tax (Incl Adjust)", "", "", "", "", "0", "0"], ["", "", "", "", "", "Net Pay", "", "", "", "", "0", "177.79"], ["ACME Payroll (Registered to AMALGAMATED CO. PTY. LTD.)", "", "", "", "", "", "", "", "", "00:00.7", "", ""]
]

const case5_spec: TableCanoniserTemplate = {
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
                offsetY: 0,
                valueCstr: (value) => {
                    if (typeof value === "string") return value.startsWith("ACME Payroll");
                    return false;
                },
            },
        ],
        traverse: {
            yDirection: "after",
        }
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
                }
            },
            extract: {
                byPositionToTargetCols: ["EmployeeID", "Employee Name"],
            },
        },
    ],
};

const { rootArea, tidyData } = transformTable(case5_mt, [case5_spec]);
// // console.log(serialize(rootArea));
console.log(tidyData);