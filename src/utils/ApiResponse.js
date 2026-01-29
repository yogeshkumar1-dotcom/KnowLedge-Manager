class ApiResponse {
  constructor(statusCode, data, message = "Success", token = null) {
    this.statusCode = statusCode;
    this.data = data;
    this.token = token;
    this.message = message;
    this.success = statusCode < 400;

    if (token) {
      this.token = token;
    }
  }
}

export default ApiResponse;
