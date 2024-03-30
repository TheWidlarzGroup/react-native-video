import Foundation

@available(iOS, deprecated: 15.0, message: "Use the built-in API instead")
@available(tvOS, deprecated: 15.0, message: "Use the built-in API instead")
extension URLSession {
    func data(from request: URLRequest) async throws -> (Data, URLResponse) {
        if #available(iOS 15, tvOS 15, *) {
            return try await URLSession.shared.data(for: request)
        } else {
            return try await withCheckedThrowingContinuation { continuation in
                let task = self.dataTask(with: request, completionHandler: { data, response, error in
                    guard let data, let response else {
                        let error = error ?? URLError(.badServerResponse)
                        return continuation.resume(throwing: error)
                    }

                    continuation.resume(returning: (data, response))
                })

                task.resume()
            }
        }
    }
}
