import axios from "axios";
import { XMLParser } from 'fast-xml-parser';


export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const itemUrl: string = query.url as string;

    try {
        console.log("back-end accesss xml of site: ", itemUrl)
        
        const response = await axios.get(itemUrl, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });

        const xmlData = response.data;

        const parser = new XMLParser();
        const result = parser.parse(xmlData);

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Error fetching XML',
            headers: { 'Content-Type': 'text/plain' }
        };
    }
});
