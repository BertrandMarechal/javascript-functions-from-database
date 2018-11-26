import pg from 'pg-promise';
const pgp = pg();
const pgConnectionString = 'postgres://root:route@localhost/postgres';

export interface JsonObjectWithMethods {
    [key: string]: string | number | JsonObjectWithMethods | Function
};
export interface JsonObjectWithoutMethods {
    [key: string]: string | number | JsonObjectWithoutMethods
};

export class PostgesUtils {
    db: any;

    /**
     * Goes through the properties of an object, and set the functions to string
     * @param obj Object to convert
     */
    static preProcessJsonObject(obj: JsonObjectWithMethods): JsonObjectWithoutMethods {
        return {
            ...Object.keys(obj).reduce((agg: JsonObjectWithoutMethods, key: string) => {
                if (typeof obj[key] === 'function') {
                    agg[key] = obj[key].toString();
                } else if (typeof obj[key] === 'object') {
                    agg[key] = PostgesUtils.preProcessJsonObject(<JsonObjectWithMethods>obj[key]);
                } else {
                    agg[key] = <string|number>obj[key];
                }
                return agg;
            }, {})
        };
    }

    /**
     * Goes through the properties of an object, and sets the functions from string back to functions
     * @param obj Object to convert
     */
    static postProcessJsonObject(obj: JsonObjectWithoutMethods): JsonObjectWithMethods {
        return {
            ...Object.keys(obj).reduce((agg: JsonObjectWithMethods, key: string) => {
                if (typeof obj[key] === 'string' && (<string>obj[key]).match(/\(.*?\).?\=\>/)) {
                    eval(`agg[key] = ${obj[key]};`);
                } else if (typeof obj[key] === 'object') {
                    agg[key] = PostgesUtils.postProcessJsonObject(<JsonObjectWithoutMethods>obj[key]);
                } else {
                    agg[key] = obj[key];
                }
                return agg;
            }, {})
        };
    }

    constructor() {
        this.db = pgp(pgConnectionString);
    }
    /**
     * Inserts the converter in the database
     * @param converter Any json object
     */
    async insert(name: String, converter: JsonObjectWithoutMethods) {
        try {
            return await this.db.any(`INSERT INTO postgres_json_test (name, f_in_object) VALUES ($1, $2)`, [name, converter]);
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * Empties the table
     */
    async del() {
        try {
            return await this.db.any(`DELETE FROM postgres_json_test`);
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * Retrieves the record from the database
     * @param name Name of the property we are trying to retrieve
     */
    async select(name: string): Promise<{f_in_object: JsonObjectWithoutMethods}[] | undefined> {
        try {
            return await this.db.any(`select f_in_object FROM  postgres_json_test WHERE name = $1`, [name]);
        } catch (error) {
            console.log(error);
        }
    }

    close() {
        pgp.end();
    }
}