import visualization from '../visualization.json';

export const groupVariable = _.get(visualization, 'variables[1].name');
export const axisVariable = _.get(visualization, 'variables[0].name');

const getTableRow = (label, value, color='') => `<div class="zd_tooltip_info_table_row"><div class="zd_tooltip_info_table_row_label">${label}</div><div class="zd_tooltip_info_table_row_value">${color} ${value}</div></div>`;

/**
 * Get Trend Attribute label
 */
const getGeneralLabel = () => {
    const accessor = controller.dataAccessors[groupVariable];
    const accessorGroup = accessor.getGroup();
    return `${accessorGroup.label} ${accessor._timeZoneId} (${accessorGroup.func})`;
}

const getTooltipMetric = (params, metric, idx) => {
    if (_.has(metric, 'label') && _.has(metric, 'func') && _.has(params, 'data.datum') && _.isNumber(idx)) {
        const func = metric.func ? `(${metric.func})` : '';
        const color = idx === params.seriesIndex ? `<div class="color_icon active" style="background-color: ${params.color};"></div>` : '';
        return `<div class="zd_tooltip_info_table_row">${getTableRow(`${metric.label} ${func}`, `${controller.dataAccessors[axisVariable].formatted(params.data.datum, idx)}`, color)}</div>`;
    }
    return '';
}

const getMetric = params => {
    if (_.has(params, 'data.datum.current.count')) {
        return _.join(controller.dataAccessors[axisVariable].getMetrics().map((metric, idx) => getTooltipMetric(params, metric, idx)), '');
    }
    return '';
}

const getYAxisData = (data, metric) => {
    if (metric.name != visualization.variables[0].defaultValue[0].name) {
        return data.map(datum => ({ value: _.get(datum.current.metrics, `${metric.name}.${metric.func}`), datum }));
    } 
    return data.map(datum => ({ value: datum.current.count, datum }));
}

/**
 * Format number to k, M, G (thousand, Million)
 * @param {Number} number 
 * @param {Number} digits 
 */
export const SIFormat = (number, digits=0) => {
    const codeTable = ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T'];
    const [exponentialNumber, exponential] = number.toExponential(digits).split('e');
    const index = Math.floor(_.parseInt(exponential) / 3);
    return exponentialNumber * Math.pow(10, _.parseInt(exponential) - index * 3) + codeTable[index + 4];
}

export const getMetricTooltip = params => {
    if (params && _.has(params, 'name') && _.has(params, 'color') && _.has(params, 'data.value')) {
        const label = getGeneralLabel();
        // Access value directly from datum, because params.name can be empty when mouse move
        const value = controller.dataAccessors[groupVariable].formatted(params.data.datum);
        const metric = getMetric(params);
        return `<div class="zd_tooltip_info_group customized"><div class="zd_tooltip_info_table"><div class="zd_tooltip_info_table_row">${getTableRow(label, value)}</div>${metric}</div></div>`;
    }
    return '';
};

export const getSeries = (data, metric) => {
    const dataColor = controller.getColorAccessor().color({ name: metric.name });
    return {
        type: 'line',
        data: getYAxisData(data, metric),
        itemStyle: {
            color: dataColor,
        },
        markLine: {
            symbol: ['none', 'none'],
            label: {
                show: false,
            },
            lineStyle: {
                type: 'dotted',
                width: 2,
                emphasis: {
                    type: 'dotted',
                    width: 2,
                }
            },
            data: null,
            animation: true,
            silent: true,
        },
    };
};