import { Request, Response, NextFunction } from "express";

const jsonGenerator = (data: any): string => {
	const jsonString = JSON.stringify(data, null, 2);
	return jsonString;
}
export default jsonGenerator;

const jsonString = jsonGenerator({
	name: "John Doe",
	email: "json@gmail.com",
	phone: "123-456-7890",
	company: "Example Corp",
	jobTitle: "Software Engineer"
});
console.log(jsonString);

const jsonUploardController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { name, email, phone, company, jobTitle } = req.body;
		const jsonString = jsonGenerator({
			name: name,
			email: email,
			phone: phone,
			company: company,
			jobTitle: jobTitle
		});
		res.json({ success: true, jsonString });
	} catch (error) {
		console.error("Error creating contact:", error);
		res.status(500).json({ message: "Failed to create contact in Salesforce" });
	}
}

export { jsonUploardController };