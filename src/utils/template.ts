import { TableStore, TblCell } from "@/store/table";
import { TypeColor, typeMapColor } from "./style";
import * as d3 from 'd3';
import { lang, langConfig } from "@/utils/lang";

export let tempZoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;


export const drawTblTemplate = (container: SVGSVGElement | null, tableStore: TableStore, percentWidth: number = 0.8) => {
    if (!container) return;
    // Clear any existing SVG
    const svg = d3.select(container);
    // Clear any existing SVG
    svg.select('g.right').remove();

    try {
        const visChildren = tableStore.spec.visTree.children
        if (visChildren === undefined || visChildren.length === 0 || visChildren[0].width === 0 || visChildren[0].height === 0) return;

        const containerWidth = container.clientWidth * percentWidth;
        const containerHeight = container.clientHeight;


        let cellWidth = Math.max(5, Math.min(90, Math.floor(containerWidth / visChildren[0].width)));
        let cellHeight = Math.max(5, Math.min(30, Math.floor(containerHeight / visChildren[0].height)));
        // const cellWidth = 90;
        // const cellHeight = 30;

        tempZoom = d3.zoom<SVGSVGElement, unknown>()
            // .scaleExtent([0.5, 3.5])  // set the zoom scale range
            .on('zoom', function (event) {
                // svg.attr('transform', event.transform);  // 直接设置svg的transform属性会导致缩放后的坐标系不正确（导致的问题是：用鼠标平移（pan）矩形的时候，矩形会抖动，导致矩形实际平移的距离小于鼠标平移的距离），因此需要在svg内部再添加一个g元素
                matrix.attr('transform', `translate(${tableStore.tree.offset.right.x + event.transform.x}, ${tableStore.tree.offset.right.y + event.transform.y}) scale(${event.transform.k})`); // Update the matrix transform based on the zoom event
                updateCellTextVisibility(event.transform.k); // Update cell text visibility based on the current scale
                // transformStatue = event.transform;
                tableStore.updateCurve();
            })
            .filter(function (event) {
                // 过滤掉双击事件
                return !event.ctrlKey && !event.button && event.type !== 'dblclick';
            });
        const g = svg.append('g').classed("right", true)
            .call(tempZoom as any) // .on('dblclick.zoom', null)  // 禁用双击缩放

        const matrix = g.append('g').classed("tbl-template", true);  // Append a 'g' element for better transform management to avoid jittering

        // 监听鼠标进入事件，在鼠标悬浮时启用 zoom 行为
        matrix.on('mouseover', () => {
            svg.call(tempZoom as any);
            // const transform = d3.zoomTransform(matrix.node() as SVGSVGElement);
            // console.log(transform);
        });

        // 监听鼠标离开事件，在鼠标离开时禁用 zoom 行为
        matrix.on('mouseout', () => {
            svg.on('.zoom', null);  // 移除 zoom 事件监听器
            // const transform = d3.zoomTransform(matrix.node() as SVGSVGElement);
            // console.log(transform);
        });


        let texts: any = null;

        const grids = tableStore.computeTblPatternGrid();
        // console.log("grids", grids);

        const cells = matrix.selectAll('rect')
            .data(grids)
            .enter().append('rect').classed('tbl-template-cell', true)
            .attr('x', d => d.col * cellWidth)
            .attr('y', d => d.row * cellHeight)
            // .attr('id', d => `tbl-template-${d.row}-${d.col}`)
            .attr('width', cellWidth)
            .attr('height', cellHeight)
            .attr('fill', (d) => d.bgColor ? typeMapColor[d.bgColor as TypeColor] : typeMapColor.cellFill)
            .attr('stroke', '#cccccc')
            .on('mouseover', function (this: SVGRectElement) {
                d3.select(this).raise() // Bring the cell to the front 
                    // .attr('fill', '#ece9e6')
                    // .attr('stroke', '#4b8aff')
                    .attr('stroke-width', 2);
                if (texts) {
                    texts.raise();
                }
            })
            .on('mouseout', function () {
                d3.select(this)
                    // .attr('fill', '#f9f7ff')
                    // .attr('stroke', '#cccccc')
                    .attr('stroke-width', 1);
                d3.select('.tbl-container .tbl-template-highlight').raise();
            })
            .on('click', function (event, d: TblCell) {
                // tableStore.grid_cell_click({ row: d.row + visChildren[0].y, col: d.col + visChildren[0].x });
                const row = d.row + visChildren[0].y;
                const col = d.col + visChildren[0].x;
                d3.select(`#grid-${row}-${col}`).dispatch('click');
                tableStore.highlightNodes([[row, col, row, col]]);
                tableStore.input_tbl.instance.deselectCell();
                tableStore.output_tbl.instance.deselectCell();
            })
            .append('title').text(d => {
                if (d.text && d.text.length) {
                    return langConfig[lang].others.targetCol + "\n" + d.text.toString();
                    /*
                    if (d.bgColor === typeMapColor.position || d.bgColor === typeMapColor.positionShallow) {
                        return "The cell's Target Column is:\n" + d.text.toString();
                    } else {
                        return "The cell's Target Column may be:\n" + d.text.toString();
                    }*/
                } else {
                    return langConfig[lang].others.noTargetCol;
                }
            });

        // Calculate the offset to center the matrix in the SVG container
        tableStore.tree.offset.right.x = container.clientWidth * (1 - percentWidth) + Math.max((containerWidth - matrix.node()!.getBBox().width) / 2, 0);
        tableStore.tree.offset.right.y = Math.max((containerHeight - matrix.node()!.getBBox().height) / 2, 0);
        matrix.attr('transform', `translate(${tableStore.tree.offset.right.x}, ${tableStore.tree.offset.right.y})`); // Center the matrix


        const updateCellTextVisibility = (scale: number) => {
            const scaledCellWidth = cellWidth * scale;
            const scaledCellHeight = cellHeight * scale;
            // const cellArea = scaledCellWidth * scaledCellHeight;
            if (scaledCellWidth >= 90 || scaledCellHeight >= 30) {
                if (texts) {
                    texts.style('display', 'block');
                } else {
                    texts = matrix.selectAll('text')
                        .data(grids)
                        .enter().append('text').classed('tbl-template-text', true)
                        .attr('x', d => d.col * cellWidth + cellWidth / 2)
                        .attr('y', d => d.row * cellHeight + cellHeight / 2)
                        .attr('dy', '.30em')
                        .attr('font-size', 15 / scale)
                        .attr('fill', (d) => d.textColor ? typeMapColor[d.textColor as TypeColor] : typeMapColor.cellFill)
                        .attr('text-anchor', 'middle')
                        .text(d => d.text ? d.text[0] : '')
                        .each(function (d) {
                            const textElement = d3.select(this);
                            let text = textElement.text();
                            let textLength = this.getComputedTextLength();
                            // 如果文本超出最大宽度，进行截断
                            while (textLength > cellWidth && text.length > 0) {
                                text = text.slice(0, -1);
                                textElement.text(text + '…');
                                textLength = this.getComputedTextLength();
                            }
                        })
                        .style('display', 'block')
                        .style('pointer-events', 'none'); // Ensure text does not capture mouse events, in order to allow clicking on the cells
                }
            } else {
                if (texts) {
                    texts.style('display', 'none');
                }
            }
        };

        updateCellTextVisibility(1); // Initial update for default scale 1

        tableStore.tree.tblVisHighlight = matrix.append('g').classed('tbl-template-highlight', true);
        tableStore.tree.tblVisInfo = {
            x: visChildren[0].x,
            y: visChildren[0].y,
            width: cellWidth,
            height: cellHeight
        }

    }
    catch (e) {
        console.error(e);
    }
}