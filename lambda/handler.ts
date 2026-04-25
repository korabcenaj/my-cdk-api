import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';


const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  if (event.httpMethod === 'GET') {
    const result = await client.send(new ScanCommand({ TableName: TABLE }));
    return { statusCode: 200, body: JSON.stringify(result.Items) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const item = { id: randomUUID(), ...body };
    await client.send(new PutCommand({ TableName: TABLE, Item: item }));
    return { statusCode: 201, body: JSON.stringify(item) };
  }

  if (event.httpMethod === 'PUT' && id) {
    const body = JSON.parse(event.body || '{}');
    await client.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: 'set #n = :n',
      ExpressionAttributeNames: { '#n': 'name' },
      ExpressionAttributeValues: { ':n': body.name },
    }));
    return { statusCode: 200, body: JSON.stringify({ id, ...body }) };
  }

  if (event.httpMethod === 'DELETE' && id) {
    await client.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    return { statusCode: 200, body: JSON.stringify({ deleted: id }) };
  }
  
  return { statusCode: 405, body: 'Method not allowed' };
};