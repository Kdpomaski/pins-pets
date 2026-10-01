import AuthenticationServices
import Capacitor
import UIKit

/// Presents Supabase OAuth (Sign in with Apple) in ASWebAuthenticationSession
/// and returns the `com.two20tech.pinspets` callback URL to JavaScript.
/// The Apple Services ID and client secret stay in the Supabase Apple provider.
@objc(NativeOAuthPlugin)
public class NativeOAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "NativeOAuthPlugin"
    public let jsName = "NativeOAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
    ]

    private var session: ASWebAuthenticationSession?

    @objc public func start(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let authURL = URL(string: urlString) else {
            call.reject("Missing OAuth URL.")
            return
        }
        let callbackScheme = call.getString("callbackScheme") ?? "com.two20tech.pinspets"

        DispatchQueue.main.async {
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: callbackScheme) { [weak self] callbackURL, error in
                self?.session = nil
                if let authError = error as? ASWebAuthenticationSessionError, authError.code == .canceledLogin {
                    call.reject("Sign-in was canceled.")
                    return
                }
                if let error {
                    call.reject(error.localizedDescription)
                    return
                }
                guard let callbackURL else {
                    call.reject("Sign-in returned without a callback URL.")
                    return
                }
                call.resolve(["url": callbackURL.absoluteString])
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            if !session.start() {
                self.session = nil
                call.reject("Could not open Sign in with Apple.")
            }
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        if let window = bridge?.webView?.window {
            return window
        }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow) {
            return window
        }
        return ASPresentationAnchor()
    }
}

/// Registers the OAuth session plugin on the Capacitor bridge used by SceneDelegate.
class PinsBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(NativeOAuthPlugin())
    }
}
