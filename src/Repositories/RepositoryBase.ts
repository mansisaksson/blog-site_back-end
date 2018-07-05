import * as mongoose from 'mongoose';
import { IUserModel } from '../models/User';

export interface IRead<T> {
	retrieve: (callback: (error: any, result: any) => void) => void;
	findById: (id: string, callback: (error: any, result: T) => void) => void;
	findOne(cond?: Object, callback?: (err: any, res: T) => void): mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>;
	find(cond: Object, fields: Object, options: Object, callback?: (err: any, res: T[]) => void): mongoose.DocumentQuery<mongoose.Document[], mongoose.Document>;
}

export interface IWrite<T> {
	create: (item: T, callback: (error: any, result: any) => void) => void;
	update: (_id: mongoose.Types.ObjectId, item: T, callback: (error: any, result: any) => void) => void;
	delete: (_id: string, callback: (error: any, result: any) => void) => void;
}

export class RepositoryBase<T extends mongoose.Document> implements IRead<T>, IWrite<T> {
	private _model: mongoose.Model<mongoose.Document>;

	constructor(schemaModel: mongoose.Model<mongoose.Document>) {
		this._model = schemaModel;
	}

	create(item: T): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			try {
				this._model.create(item).then((result) => {
					resolve(<T>result)
				})
			} catch (error) {
				reject(error)
			}
		})
	}

	retrieve(callback: (error: any, result: T) => void) {
		this._model.find({}, callback);
	}

	update(_id: mongoose.Types.ObjectId, item: T, callback: (error: any, result: any) => void) {
		this._model.update({ _id: _id }, item, callback);
	}

	delete(_id: string, callback: (error: any, result: any) => void) {
		this._model.remove({ _id: this.toObjectId(_id) }, (err) => callback(err, null));
	}

	findById(_id: string, callback: (error: any, result: T) => void) {
		this._model.findById(_id, callback);
	}

	findOne(cond?: Object, callback?: (err: any, res: T) => void): mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> {
		return this._model.findOne(cond, callback).getQuery();
	}

	find(cond?: Object, fields?: Object, options?: Object, callback?: (err: any, res: T[]) => void): mongoose.DocumentQuery<mongoose.Document[], mongoose.Document> {
		return this._model.find(cond, options, callback);
	}

	private toObjectId(_id: string): mongoose.Types.ObjectId {
		return mongoose.Types.ObjectId.createFromHexString(_id);
	}
}
