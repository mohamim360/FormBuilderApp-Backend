import express, { NextFunction, Request, Response } from 'express';
import { createContact } from '../services/salesforce.service';

// interface UserData {
// 	name: string;
// 	email: string;
// 	phone: string;
// }
// interface SalesforceResult{
// 	id: string;
// 	success: boolean;
// 	errors?: string[];
// }

export const connectSalesforce = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { name, email, phone } = req.body;
	
		const result = await createContact({
			name: name,
			email: email,
			phone: phone
		});
		res.json({success : true, contactId: result.id});
	}catch (error) {
		console.error("Error creating contact:", error);
		res.status(500).json({ message: "Failed to create contact in Salesforce" });
	}
}