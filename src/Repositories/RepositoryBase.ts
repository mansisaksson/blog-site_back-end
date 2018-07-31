import * as mongoose from 'mongoose';

export interface IRead<T> {
	retrieve(): Promise<T>
	findById(id: string): Promise<T>
	findOne(cond?: Object): Promise<T>
	find(cond: Object, limit: number, sort?: Object): Promise<T[]>
}

export interface IWrite<T> {
	create(item: T): Promise<T>
	update(_id: mongoose.Types.ObjectId, item: T): Promise<any>
	delete(_id: string): Promise<any>
}

export class RepositoryBase<T extends mongoose.Document> implements IRead<T>, IWrite<T> {
	private _model: mongoose.Model<mongoose.Document>;

	constructor(schemaModel: mongoose.Model<mongoose.Document>) {
		this._model = schemaModel;
	}

	create(item: T): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this._model.create(item).then((result) => {
				resolve(<T>result)
			}).catch(error => reject(error))
		})
	}

	retrieve(): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let callback = (error: any, result: T) => {
				if (error) { reject(error) }
				else { resolve(result) }
			}
			this._model.find({}, callback);
		})
	}

	update(_id: mongoose.Types.ObjectId, item: T): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let callback = (error: any, result: any) => {
				if (error) { reject(error) }
				else { resolve(result) }
			}
			this._model.update({ _id: _id }, item, callback);
		})
	}

	delete(_id: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let callback = (error: any, result: any) => {
				if (error) { reject(error) }
				else { resolve(result) }
			}
			this._model.remove({ _id: this.toObjectId(_id) }, (err) => callback(err, null));
		})
	}

	deleteAll(_ids: string[]): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let callback = (error: any, result: any) => {
				if (error) { reject(error) }
				else { resolve(result) }
			}

			let objectIds = []
			_ids.forEach(id => objectIds.push(this.toObjectId(id)))
			this._model.remove({ _id: { $in: objectIds } }, (err) => callback(err, null));
		})
	}

	findById(_id: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let callback = (error: any, result: T) => {
				if (error) { reject(error) }
				else { resolve(result) }
			}
			this._model.findById(_id, callback);
		})
	}

	findOne(cond?: Object): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let callback = (err: any, res: T) => {
				if (err) { reject(err) }
				else { resolve(res) }
			}
			this._model.findOne(cond, callback);
		})
	}

	find(cond: Object, limit: number, sort?: Object): Promise<T[]> {
		return new Promise<T[]>((resolve, reject) => {
			let callback = (err: any, res: T[]) => {
				if (err) { reject(err) }
				else { resolve(res) }
			}
			this._model.find(cond).sort(sort).limit(limit).exec(callback)
		})
	}

	private toObjectId(_id: string): mongoose.Types.ObjectId {
		return mongoose.Types.ObjectId.createFromHexString(_id);
	}
}
