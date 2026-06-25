import ExpoModulesCore
import UIKit
import ObjectiveC

private var globalInterceptedTabIndex: Int = -1
private var isSwizzled = false

extension Notification.Name {
  static let addTabIntercepted = Notification.Name("AddTabIntercepted")
}

extension UITabBar {
  @objc func swizzled_setSelectedItem(_ item: UITabBarItem?) {
    if let item = item,
       let items = self.items,
       let index = items.firstIndex(where: { $0 === item }),
       index == globalInterceptedTabIndex {
      NotificationCenter.default.post(name: .addTabIntercepted, object: nil)
      return
    }
    swizzled_setSelectedItem(item)
  }
}

public class AddTabInterceptorModule: Module {
  private var notificationObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("AddTabInterceptor")

    Events("onInterceptedTabPress")

    Function("setInterceptedTabIndex") { (index: Int) in
      globalInterceptedTabIndex = index
      if !isSwizzled {
        AddTabInterceptorModule.swizzleUITabBar()
        isSwizzled = true
      }
    }

    OnStartObserving {
      self.notificationObserver = NotificationCenter.default.addObserver(
        forName: .addTabIntercepted,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onInterceptedTabPress")
      }
    }

    OnStopObserving {
      if let observer = self.notificationObserver {
        NotificationCenter.default.removeObserver(observer)
        self.notificationObserver = nil
      }
    }
  }

  private static func swizzleUITabBar() {
    let originalSelector = #selector(setter: UITabBar.selectedItem)
    let swizzledSelector = #selector(UITabBar.swizzled_setSelectedItem(_:))

    guard
      let originalMethod = class_getInstanceMethod(UITabBar.self, originalSelector),
      let swizzledMethod = class_getInstanceMethod(UITabBar.self, swizzledSelector)
    else { return }

    method_exchangeImplementations(originalMethod, swizzledMethod)
  }
}
