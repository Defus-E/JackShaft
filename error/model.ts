export default class ModelError extends Error {
  public status: number;
  public message: string;
  
	constructor(message: string, status?: number) {
		super(...Array.from(arguments));

		Error.captureStackTrace(this, ModelError);
		Object.setPrototypeOf(this, ModelError.prototype);

    this.message = message;
    this.status = status;
	}

	get name() {
		return 'ModelError';
	}
}