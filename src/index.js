import echarts from 'echarts';
import { 
    getSeries, 
    SIFormat, 
    getMetricTooltip,
    groupVariable,
    axisVariable,
    getFont
 } from './utils';

import './index.css';

/**
 * Global controller object is described on Zoomdata knowledge base
 * @see https://www.zoomdata.com/developers/docs/custom-chart-api/controller/
 */

/* global controller */

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/creating-chart-container/
 */
const chartContainer = document.createElement('div');
chartContainer.classList.add('chart-container');
controller.element.appendChild(chartContainer);

// Dynamic the splitNumber to avoid overlap
echarts.registerProcessor(ecModel => {
    ecModel.findComponents({ mainType: 'yAxis' }).map(component => {
        const defaultSplitNumber = 5;
        const calculatedRatio = Math.floor(component.axis.grid.getRect().height / (defaultSplitNumber * component.getTextRect('0').height));
        const ratio = calculatedRatio > defaultSplitNumber ? defaultSplitNumber : calculatedRatio;

        if (ratio < 1) component.option.axisLabel.show = false;
        else {
            component.option.splitNumber = ratio;
            component.option.axisLabel.show = true;
        }
    });
});

const line = echarts.init(chartContainer);

const option = {
    grid: {
        left: 40,
        top: 30,
        right: 35,
        bottom: 30,
    },
    xAxis: {
        type: 'category',
        axisPointer: {
            show: true,
            type: 'line',
            label: {
                show: false,
            },
            lineStyle: {
                width: 2,
                type: 'solid',
            }
        },
        splitLine: {
            show: true,
        },
        axisLine: {
            lineStyle: {
                width: 2,
            }
        },
        axisLabel: getFont(),
    },
    yAxis: {
        type: 'value',
        axisLine: {
            lineStyle: {
                width: 2,
            }
        },
        axisLabel: {
            formatter: value => SIFormat(value, 2),
            ...getFont(),
        },
    },
    series: [],
}

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/updating-queries-axis-labels/
 */
controller.createAxisLabel({
    picks: groupVariable,
    orientation: 'horizontal',
    position: 'bottom',
    popoverTitle: 'Trend'
});

controller.createAxisLabel({
    picks: axisVariable,
    orientation: 'vertical',
    position: 'left'
});

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/receiving-chart-data/
 */
controller.update = data => {
    option.xAxis.data = data.map(datum => controller.dataAccessors[groupVariable].format(_.first(datum.group)));
    option.series = controller.dataAccessors[axisVariable].getMetrics().map(metric => getSeries(data, metric));
    line.setOption(option, { notMerge: true });
};

controller.resize = () => line.resize();

line.on('mouseover', params => {
    option.series[params.seriesIndex].markLine.data = [{ yAxis: params.value }];
    option.xAxis.axisPointer.lineStyle.color = params.color;
    line.setOption(option, { notMerge: true });
});

line.on('mouseout', params => {
    controller.tooltip.hide();
    option.series[params.seriesIndex].markLine.data = null;
    _.unset(option.xAxis.axisPointer.lineStyle, 'color');
    line.setOption(option, { notMerge: true });
});

// Tooltip
line.on('mousemove', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            content: () => {
                return getMetricTooltip(params);
            }
        });
    }
});

// Menu bar
line.on('click', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.hide();
        controller.menu.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            data: () => params.data.datum,
        });
    }
});
