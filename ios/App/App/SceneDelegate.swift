import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let created = UIWindow(windowScene: windowScene)
        created.rootViewController = CAPBridgeViewController()
        created.makeKeyAndVisible()
        window = created
        // UIMainStoryboardFile used to attach a second window to this scene.
        // Touches hit whichever window is in front, so a Seat tap never reached
        // the web view that drew the buttons. Keep this one window.
        collapseExtraWindows(in: windowScene)
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        guard let windowScene = scene as? UIWindowScene else { return }
        collapseExtraWindows(in: windowScene)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    private func collapseExtraWindows(in windowScene: UIWindowScene) {
        guard let keep = window else { return }
        for extra in windowScene.windows where extra !== keep && !SceneDelegate.isSystemWindow(extra) {
            extra.isHidden = true
            extra.rootViewController = nil
            extra.windowScene = nil
        }
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.window = keep
        }
    }

    private static func isSystemWindow(_ window: UIWindow) -> Bool {
        let name = NSStringFromClass(type(of: window))
        if name == "UIWindow" { return false }
        return name.contains("TextEffects") || name.contains("Keyboard") || name.contains("Remote")
    }
}
