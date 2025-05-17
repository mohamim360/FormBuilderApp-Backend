import jsforce from "jsforce";

interface UserData {
	name: string;
	email: string;
	phone: string;
}
interface SalesforceResult{
	id: string;
	success: boolean;
	errors?: string[];
}

const connection = new jsforce.Connection({
	loginUrl: process.env.SF_LOGIN_URL || "https://login.salesforce.com"
});

export async function createContact(userData: UserData): Promise<SalesforceResult> {
	try {
		await connection.login(process.env.SF_USERNAME as string, 
			`${process.env.SF_PASSWORD}${process.env.SF_SECURITY_TOKEN}`
		);
		const result = await connection.sobject("Contact").create({
			FirstName: userData.name.split(' ')[0],
      LastName: userData.name.split(' ').slice(1).join(' ') || 'User',
			Email: userData.email,
			Phone: userData.phone
		});
		return result as SalesforceResult;
	} catch (error) {
		console.error("Error creating contact:", error);
		throw new Error("Failed to create contact in Salesforce");
	}
}