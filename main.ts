import { PostgesUtils, JsonObjectWithMethods } from "./classes/postgres.utils";

const functionToConvert = (a: any) => a.firstName + ' ' + a.lastName;
const postgreSQLUtils = new PostgesUtils();

function convertField(object: any, converterField: (string|number|Function|JsonObjectWithMethods)) {
    const type = typeof converterField;    
    if (type === 'string') {
        return object[<string>converterField];
    } else if (type === 'number') {
        return converterField
    } else if (type === 'function') {
        return (<Function>converterField)(object);
    }
}
function convert(object: any, converter: JsonObjectWithMethods) {
    return {
        ...Object.keys(converter).reduce((agg, key) => {
            return {
                ...agg,
                [key]: convertField(object, converter[key])
            }
            return agg;
        }, {})
    };
}

async function main() {
    await postgreSQLUtils.del();
    await postgreSQLUtils.insert('test', PostgesUtils.preProcessJsonObject({
        name: functionToConvert,
        id: 'objId',
        system: 50
    }));
    const data = await postgreSQLUtils.select('test');
    postgreSQLUtils.close();

    if (data && data[0] && data[0].f_in_object) {
        const converter = PostgesUtils.postProcessJsonObject(data[0].f_in_object);
        const inputObject = {
            objId: 12,
            firstName: 'Bert',
            lastName: 'Marech',
            system: 60595
        };
        const outputObject = convert(inputObject, converter);
        console.log('Input',JSON.stringify(inputObject));
        console.log('Output',JSON.stringify(outputObject));
    }
}


main();